import {
  AccountCreateTransaction,
  Client,
  PrivateKey,
  PublicKey,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';
import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AccountCreateInput } from './account.interface';
import { KeyType, Network } from '../app.interface';
import { ClientService } from 'src/client/client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { In, Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { AssociateDto } from './dto/associate.dto';
import { KeyService } from 'src/key/key.service';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly clientService: ClientService,
    private readonly keyService: KeyService,
  ) {}

  // associates tokens to a user
  async associate(user: User, associateDto: AssociateDto) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey) {
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        associateDto.encryptionKey,
      );
    }
    const associatingAccount = await this.getUserAccountByAlias(
      user.id,
      associateDto.associatingId,
    ).catch(() => {
      throw new Error(
        'Unable to find account with associatingId: ' +
          associateDto.associatingId,
      );
    });

    // ALL OF THIS LOGIC SHOULD BE ENCAPSULATED IN ITS OWN FUNCTION
    // I AM USING THIS IN LOTS FT SERVICE, NFT SERVICE, ETC
    let client: Client;
    const signingKeys: PrivateKey[] = [];
    // decrypt associating account keys
    // associating account always needs to sign it association tx
    const decryptedAssociatingKeys = associatingAccount.keys.map((key) => {
      const decryptedKey = this.keyService.decryptString(
        key.encryptedPrivateKey,
        escrowKey,
      );
      // return as PrivateKey type
      switch (key.type) {
        case KeyType.ED25519:
          return PrivateKey.fromStringED25519(decryptedKey);
        case KeyType.ECDSA:
          return PrivateKey.fromStringECDSA(decryptedKey);
        default:
          throw new Error('Invalid key type in treasury account');
      }
    });
    // handle logic for payer other than associating account
    if (associateDto.payerId) {
      const payerAccount = await this.getUserAccountByAlias(
        user.id,
        associateDto.payerId,
      ).catch(() => {
        throw new Error(
          'Unable to find payer account with alias: ' + associateDto.payerId,
        );
      });
      const decryptedPayerKeys = payerAccount.keys.map((key) =>
        this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
      );
      client = this.clientService.buildClient(
        user.network,
        payerAccount.id,
        decryptedPayerKeys[0],
      );
      // add treasury account keys for signing
      signingKeys.push(decryptedAssociatingKeys[0]);
    } else {
      client = this.clientService.buildClient(
        user.network,
        associatingAccount.id,
        decryptedAssociatingKeys[0],
      );
    }

    // this should be moved into a dedicated HederaService along with all other Hedera actions
    const transaction = new TokenAssociateTransaction()
      .setAccountId(associatingAccount.id)
      .setTokenIds(associateDto.tokenIds)
      .freezeWith(client);

    if (signingKeys.length)
      await Promise.all(signingKeys.map((key) => transaction.sign(key)));

    const submit = await transaction.execute(client);
    const receipt = await submit.getReceipt(client);

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
      // this is very hacky... handles edge case where royalty fee is a non-user account
      // current issues: if tx payer is 0.0. alias, this doesn't return a key to sign
      // also, currently if a non 0.0. alias exists, the 0.0. cannot be used as signer
      return { id: alias } as Account;
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
      .getOne();
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
