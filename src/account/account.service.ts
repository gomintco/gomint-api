import { AccountCreateTransaction, PublicKey } from '@hashgraph/sdk';
import {
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AccountCreateInput } from './account.interface';
import { Network } from '../app.interface';
import { ClientService } from 'src/client/client.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './account.entity';
import { In, Repository } from 'typeorm';
import { User } from '../user/user.entity';

@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private clientService: ClientService,
  ) {}

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
    // can search by alias because if no alias, account ID is used as alias
    return this.accountRepository.findOne({
      where: { user: { id: userId }, alias },
      relations: ['keys'],
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
      relations: ['keys'],
    });
  }

  async findAccountsByIds(accountIds: string[]): Promise<Account[]> {
    return this.accountRepository.find({
      where: {
        id: In(accountIds),
      },
      relations: ['keys', 'user'],
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
    const client = this.clientService.getClient(network);
    try {
      const transactionResponse = await transaction.execute(client);
      const receipt = await transactionResponse.getReceipt(client);
      const accountId = receipt.accountId.toString();
      const account = this.accountRepository.create({
        id: accountId,
        keys: [accountCreateInput.key],
        alias: accountCreateInput.alias ?? accountId,
      });
      return new AccountBuilder(this, account);
    } catch (err) {
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
    private accountService: AccountService,
    private account: Account,
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
