import { AccountCreateTransaction, PublicKey } from '@hashgraph/sdk';
import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AccountCreateInput } from './account.interface';
import { Network } from 'src/hedera/network.enum';
import { ClientService } from 'src/client/client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { In, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { AssociateDto } from './dto/associate.dto';
import { KeyService } from 'src/key/key.service';
import { CreateTokenDto } from 'src/hedera/token/token.interface';
import { TokenService } from 'src/hedera/token/token.service';
import { TransactionService } from 'src/hedera/transaction/transaction.service';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly clientService: ClientService,
    private readonly keyService: KeyService,
    private readonly tokenService: TokenService,
    private readonly transactionService: TransactionService,
  ) {}

  // associates tokens to a user
  async associate(user: User, associateDto: AssociateDto) {
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      associateDto.encryptionKey,
    );
    const associatingAccount = await this.getUserAccountByAlias(
      user.id,
      associateDto.associatingId,
    ).catch(() => {
      throw new Error(
        'Unable to find account with associatingId: ' +
          associateDto.associatingId,
      );
    });
    // handle case if payerId is separate
    let payerAccount: Account;
    if (associateDto.payerId)
      payerAccount = await this.getUserAccountByAlias(
        user.id,
        associateDto.payerId,
      ).catch(() => {
        throw new Error(
          'Unable to find account with payerId: ' + associateDto.payerId,
        );
      });
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

  async parseCustomFeeAliases(userId: string, createTokenDto: CreateTokenDto) {
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
    if (alias.startsWith('0.0.')) {
      return this.accountRepository.findOneOrFail({
        where: { id: alias },
        relations: { keys: true },
      });
    }
    // can search by alias because if no alias, account ID is used as alias
    return this.accountRepository.findOneOrFail({
      where: { user: { id: userId }, alias },
      relations: { keys: true },
    });
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
      console.error(err);
      throw new InternalServerErrorException('Error saving account', {
        cause: err,
        description: err.code || err.message,
      });
    });
  }

  /**
   * This method creates and executes a transaction.
   * It accepts an account creation input and a network as parameters.
   * It returns an AccountBuilder instance with the created account.
   *
   * @param {AccountCreateInput} accountCreateInput - The input data for account creation.
   * @param {Network} network - The network on which the transaction will be executed.
   * @returns {Promise<AccountBuilder>} An AccountBuilder instance with the created account.
   */
  async createTransactionAndExecute(
    accountCreateInput: AccountCreateInput,
    network: Network,
  ): Promise<AccountBuilder> {
    const transaction = this.createTransaction(accountCreateInput);
    // ONLY FIRST ACCOUNT CREATION IS 'FREE'
    const client = this.clientService.getClient(network);
    // WHEN USER HAS ONE ACCOUNT THEY SHOULD USE THEIR ACCOUNT TO PAY FOR THE NEXT ACCOUNT

    try {
      const transactionResponse = await transaction.execute(client);
      const receipt = await transactionResponse.getReceipt(client);
      const accountId = receipt.accountId.toString();
      const account = this.accountRepository.create({
        id: accountId,
        keys: [accountCreateInput.key],
        alias: accountCreateInput.alias ?? accountId,
        // userId: accountCreateInput.key.user.id, // set user ID - this is used for ensuring unique account alias's per user
      });
      return new AccountBuilder(this, account);
    } catch (err: any) {
      console.error(err);
      throw new ServiceUnavailableException("Couldn't create Hedera account", {
        cause: err,
        description: err.message,
      });
    }
  }

  /**
   * This function creates a transaction.
   * It takes an account creation input as a parameter.
   * It returns a new AccountCreateTransaction object.
   *
   * @param {AccountCreateInput} accountCreateInput - The input for account creation.
   * @returns {AccountCreateTransaction} A new AccountCreateTransaction object.
   */
  private createTransaction(accountCreateInput: AccountCreateInput) {
    return (
      new AccountCreateTransaction()
        .setKey(PublicKey.fromString(accountCreateInput.key.publicKey))
        // .setAlias(accountCreateInput.alias) // removed because this clashes with the account alias
        .setInitialBalance(accountCreateInput.initialBalance)
        .setReceiverSignatureRequired(
          accountCreateInput.receiverSignatureRequired,
        )
        .setMaxAutomaticTokenAssociations(
          accountCreateInput.maxAutomaticTokenAssociations,
        )
        .setStakedAccountId(accountCreateInput.stakedAccountId)
        //   .setStakedNodeId(accountCreateInput.stakedNodeId)
        .setDeclineStakingReward(accountCreateInput.declineStakingReward)
        .setAccountMemo(accountCreateInput.accountMemo)
    );
    // .setAutoRenewPeriod() (disabled atm)
  }
}

class AccountBuilder {
  constructor(
    private readonly accountService: AccountService,
    private readonly account: Account,
  ) {}

  async addUser(user: User) {
    // TODO: check if user already exists
    this.account.user = user;
    return this;
  }

  async save(): Promise<Account> {
    return this.accountService.save(this.account);
  }
}
