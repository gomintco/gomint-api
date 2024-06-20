import {
  AccountCreateTransaction,
  Client,
  PublicKey,
  TransactionReceipt,
} from '@hashgraph/sdk';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AccountCreateInput } from './account.interface';
import { Network } from 'src/hedera-api/network.enum';
import { ClientService } from 'src/client/client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { In, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { AssociateDto } from './dto/associate.dto';
import { TokenCreateDto } from 'src/token/dto/token-create.dto';
import { KeyService } from 'src/key/key.service';
import { HederaTokenApiService } from 'src/hedera-api/hedera-token-api/hedera-token-api.service';
import { HederaTransactionApiService } from 'src/hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { AccountCreateDto } from './dto/account-create.dto';
import { HederaAccountApiService } from 'src/hedera-api/hedera-account-api/hedera-account-api.service';
import { HederaKeyApiService } from 'src/hedera-api/hedera-key-api/hedera-key-api.service';

import {
  AccountAliasAlreadyExistsError,
  AccountNotFoundError,
  NoPayerIdError
} from 'src/core/error';


@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly clientService: ClientService,
    private readonly keyService: KeyService,
    private readonly hederaAccountService: HederaAccountApiService,
    private readonly tokenService: HederaTokenApiService,
    private readonly transactionService: HederaTransactionApiService,
    private readonly hederaKeyService: HederaKeyApiService,
  ) { }

  async createAccount(
    user: User,
    accountCreateDto: AccountCreateDto,
    encryptionKey?: string,
  ) {
    // check if user has any accounts to handle if free or not
    const accountCount = await this.accountRepository.count({
      where: {
        user: {
          id: user.id,
        },
      },
    });

    if (accountCount && !accountCreateDto.payerId) throw new NoPayerIdError();

    // check if alias already exists
    const accountAliasExists = await this.accountAliasExists(
      user.id,
      accountCreateDto.alias,
    );
    if (accountAliasExists) {
      throw new AccountAliasAlreadyExistsError();
    }

    // decrypt user escrow key
    const escrowKey = this.keyService.decryptUserEscrowKey(user, encryptionKey);

    let payerAccount: Account;
    if (accountCount)
      payerAccount = await this.getUserAccountByAlias(
        user.id,
        accountCreateDto.payerId,
      );

    // this can potentially be made into its own method here
    const client = accountCount
      ? // if has account, user payerAccount to execute
      this.clientService.buildClientAndSigningKeys(
        user.network,
        escrowKey,
        payerAccount,
      ).client
      : // if no accounts, GoMint will pay
      this.clientService.getGoMintClient(user.network);

    // create the threshold key with GoMint account for management if anything goes wrong
    const { keyList, privateKey } = this.hederaKeyService.generateGoMintKeyList(
      accountCreateDto.type,
      user.network,
    );
    // encrypt and attach user to key
    const key = await this.keyService.attachUserToKey(
      accountCreateDto.type,
      privateKey,
      escrowKey,
      user,
    );
    // create account transaction
    const accountCreateTransaction =
      this.hederaAccountService.createTransaction(accountCreateDto, keyList);
    // execute tx
    const receipt =
      await this.transactionService.freezeSignExecuteAndGetReceipt(
        accountCreateTransaction,
        client,
      );
    // .getClient method uses the GoMint account as payer
    const accountId = receipt.accountId.toString();
    // save account and attach user and key
    const account = this.accountRepository.create({
      id: accountId,
      keys: [key],
      alias: accountCreateDto.alias ?? accountId,
      user: user,
    });
    await this.accountRepository.save(account);
    return accountId;
  }

  /**
   * Associates tokens to a user
   */
  async associate(
    user: User,
    associateDto: AssociateDto,
    encryptionKey?: string,
  ) {
    const escrowKey = this.keyService.decryptUserEscrowKey(user, encryptionKey);
    const associatingAccount = await this.getUserAccountByAlias(
      user.id,
      associateDto.associatingId,
    );
    // handle case if payerId is separate
    let payerAccount: Account;
    if (associateDto.payerId) {
      payerAccount = await this.getUserAccountByAlias(
        user.id,
        associateDto.payerId,
      );
    }
    // build client and signers
    const { client, signers } = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      associatingAccount,
      payerAccount,
    );
    // handle token associate transaction
    const transaction = this.tokenService.associateTransaction(associateDto);
    const receipt =
      await this.transactionService.freezeSignExecuteAndGetReceipt(
        transaction,
        client,
        signers,
      );
    return receipt.status.toString();
  }

  /**
   * Checks if an account alias already exists for a given user ID.
   * @param userId The user's ID to check the alias against.
   * @param alias The alias to check for existence.
   * @returns Promise resolving to a boolean indicating if the alias exists.
   */
  async accountAliasExists(userId: string, alias: string): Promise<boolean> {
    const account = await this.accountRepository.findOne({
      where: {
        alias: alias,
        user: { id: userId },
      },
      relations: { user: true }, // This ensures the user relationship is joined
    });
    // Return true if an account is found, otherwise false
    return !!account;
  }

  async parseCustomFeeAliases(userId: string, createTokenDto: TokenCreateDto) {
    // doesn't feel like this function belongs here...
    const parseFees = async (fees, feeProcessor) => {
      return await Promise.all(fees.map(feeProcessor));
    };
    const processFee = async (fee) => ({
      ...fee,
      feeCollectorAccountId: await this.getUserAccountIdByAlias(
        userId,
        fee.feeCollectorAccountId,
      ),
    });
    const processRoyaltyFee = async (fee) => {
      const processedFee = await processFee(fee);
      if (fee.fallbackFee) {
        processedFee.fallbackFee = await processFee(fee.fallbackFee);
      }
      return processedFee;
    };
    // Collect all fee processing promises
    const feeProcessingPromises = [];
    // parse fixed fees
    if (createTokenDto.fixedFees) {
      const fixedFeesPromise = parseFees(createTokenDto.fixedFees, processFee);
      feeProcessingPromises.push(fixedFeesPromise);
    } else {
      feeProcessingPromises.push([]);
    }
    // parse fractional fees
    if (createTokenDto.fractionalFees) {
      const fractionalFeesPromise = parseFees(
        createTokenDto.fractionalFees,
        processFee,
      );
      feeProcessingPromises.push(fractionalFeesPromise);
    } else {
      feeProcessingPromises.push([]);
    }
    // parse royalty fees
    if (createTokenDto.royaltyFees) {
      const royaltyFeesPromise = parseFees(
        createTokenDto.royaltyFees,
        processRoyaltyFee,
      );
      feeProcessingPromises.push(royaltyFeesPromise);
    } else {
      feeProcessingPromises.push([]);
    }
    // Wait for all processing to complete
    const [fixedFees = [], fractionalFees = [], royaltyFees = []] =
      await Promise.all(feeProcessingPromises);
    // Assign processed fees
    createTokenDto.fixedFees = fixedFees;
    createTokenDto.fractionalFees = fractionalFees;
    createTokenDto.royaltyFees = royaltyFees;
    return createTokenDto;
  }

  /**
   * This function retrieves the account ID of a user by their alias.
   * It takes the user ID and alias as parameters.
   * It returns a Promise that resolves to the account ID as a string.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} alias - The alias of the account.
   * @returns {Promise<string>} A Promise that resolves to the account ID as a string.
   */
  async getUserAccountIdByAlias(
    userId: string,
    alias: string,
  ): Promise<string> {
    // if alias is already in account ID format, just return alias
    if (alias.startsWith('0.0.')) {
      return alias;
    }
    const account = await this.accountRepository.findOne({
      where: { user: { id: userId }, alias },
    });

    if (!account) {
      throw new Error(`Account not found for alias: ${alias}`);
    }

    return account.id;
  }

  /**
   * This function retrieves the user account by their alias.
   * It takes the user ID and alias as parameters.
   * It returns a Promise that resolves to the Account object with its relevant keys.
   *
   * @param {string} userId - The ID of the user.
   * @param {string} alias - The alias of the account.
   * @returns {Promise<Account>} A Promise that resolves to the Account object with its relevant keys.
   */
  async getUserAccountByAlias(userId: string, alias: string): Promise<Account> {
    let account: Account;
    if (alias.startsWith('0.0.')) {
      account = await this.accountRepository.findOne({
        where: { id: alias },
        relations: { keys: true },
      });
    } else {
      // can search by alias because if no alias, account ID is used as alias
      account = await this.accountRepository.findOne({
        where: { user: { id: userId }, alias },
        relations: { keys: true },
      });
    }
    if (!account) {
      throw new AccountNotFoundError(
        `Account associated with ${alias} is not found`,
      );
    }
    return account;
  }

  async getUserAccountByPublicKey(
    userId: string,
    publicKey: string,
  ): Promise<Account> {
    return this.accountRepository
      .createQueryBuilder('account')
      .leftJoinAndSelect('account.keys', 'key')
      .leftJoinAndSelect('account.user', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('key.publicKey LIKE :publicKey', {
        publicKey: `%${publicKey}%`,
      })
      .getOneOrFail();
  }

  async findAccountsByUserId(id: string): Promise<Account[]> {
    return this.accountRepository.find({
      where: { user: { id } },
      relations: { keys: true },
    });
  }

  async findAccountsByIds(accountIds: string[]): Promise<Account[]> {
    return this.accountRepository.find({
      where: {
        id: In(accountIds),
      },
      relations: { keys: true, user: true },
    });
  }

  async save(account: Account): Promise<Account> {
    return this.accountRepository.save(account).catch((err) => {
      this.logger.error(err);
      throw new InternalServerErrorException('Error saving account', {
        cause: err,
        description: err.code || err.message,
      });
    });
  }

}
