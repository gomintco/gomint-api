import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'crypto';
import { KeyService } from 'src/key/key.service';
import { AccountService } from '../account/account.service';
import { CreateKeyDto } from './dto/create-key.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { CleanedAccount, CleanedKey, CleanedUser } from './user.interface';
import { Key } from '../key/key.entity';
import { Account } from '../account/account.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private keyService: KeyService,
    private accountService: AccountService,
  ) {}

  /**
   * This function returns all the users in the database.
   *
   * @returns A promise that resolves to an array of all the users in the database.
   */
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // findOne(id: string): Promise<User> {
  //   return this.usersRepository.findOneByOrFail({ id });
  // }

  async getUser(userId: string): Promise<CleanedUser> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['accounts.keys', 'keys'],
    });
    // clean data before returning
    const { id, username, network, accounts, keys } = user;
    const cleanedKeys = this.cleanKeys(keys);
    const cleanedAccounts = this.cleanAccounts(accounts);
    return {
      id,
      username,
      network,
      keys: cleanedKeys,
      accounts: cleanedAccounts,
    };
  }

  async getUserAccounts(
    id: string,
  ): Promise<{ id: string; accounts: CleanedAccount[] }> {
    const accounts = await this.accountService.findAccountsByUserId(id);
    return { id, accounts: this.cleanAccounts(accounts) };
  }

  async getUserKeys(id: string): Promise<{ id: string; keys: CleanedKey[] }> {
    const keys = await this.keyService.findKeysByUserId(id);

    return { id, keys: this.cleanKeys(keys) };
  }

  private cleanKeys(keys: Key[]) {
    return keys.map(({ type, publicKey }) => ({ type, publicKey }));
  }

  private cleanAccounts(accounts: Account[]) {
    return accounts.map(({ id, keys }) => ({
      id,
      keys: this.cleanKeys(keys),
    }));
  }

  findOneByUsername(username: string): Promise<User> {
    return this.usersRepository.findOneByOrFail({ username });
  }

  private handleDecryptEscrowKey(user: User, encryptionKey: string) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(user.escrowKey, encryptionKey);
    return escrowKey;
  }

  async createAndSaveKey(user: User, createKeyDto: CreateKeyDto) {
    const escrowKey = this.handleDecryptEscrowKey(
      user,
      createKeyDto.encryptionKey,
    );
    const key = await this.keyService
      .create(escrowKey, createKeyDto.type)
      .addUser(user)
      .save();
    return key;
  }

  async createAndSaveAccount(user: User, createAccountDto: CreateAccountDto) {
    const escrowKey = this.handleDecryptEscrowKey(
      user,
      createAccountDto.encryptionKey,
    );
    // create key and add to user
    const key = await this.keyService
      .create(escrowKey, createAccountDto.type)
      .addUser(user)
      .save();
    // create account and add to user
    const accountTransaction =
      await this.accountService.createTransactionAndExecute(
        { key },
        user.network,
      );
    const addUserToAccount = await accountTransaction.addUser(user);
    const account = await addUserToAccount.save();
    return account;
  }

  /**
   * This function creates a new user entity with the provided details.
   * It generates a random escrow key for the user and sets the hasPassword field based on whether a password was provided.
   * The created user entity is not saved to the database.
   *
   * @param createUserDto - The data transfer object containing the user's details.
   * @returns The created user entity.
   */
  create(createUserDto: CreateUserDto): User {
    return this.usersRepository.create({
      network: createUserDto.network,
      username: createUserDto.username,
      hashedPassword: createUserDto.hashedPassword,
      escrowKey: crypto.randomBytes(16).toString('hex'),
      hasEncryptionKey: Boolean(createUserDto.encryptionKey),
      email: createUserDto.email,
    });
  }

  /**
   * This function handles the creation of a key or account for a user.
   * If the createUserDto.withAccount flag is set, it creates a Hedera account and assigns it to the user.
   * If the createUserDto.withKey flag is set, it creates a new key using the user's escrow key and assigns it to the user.
   * If neither flag is set, it logs that only a user is being created.
   *
   * @param user - The user for whom the key or account is to be created.
   * @param createUserDto - The data transfer object containing the user's details.
   */
  async handleKeyOrAccountCreation(user: User, createUserDto: CreateUserDto) {
    if (!createUserDto.withAccount && !createUserDto.withKey) {
      // logging for data tracking in future
      return console.log('Only creating user');
    }

    const key = await this.keyService.create(user.escrowKey).save();
    user.keys = [key];
    // user.keys = Promise.resolve([key]);

    if (createUserDto.withAccount) {
      const accountTransaction =
        await this.accountService.createTransactionAndExecute(
          { key, initialBalance: 0 },
          createUserDto.network,
        );
      const account = await accountTransaction.save();
      user.accounts = [account];
      // user.accounts = Promise.resolve([account]);
    }
  }

  /**
   * This function encrypts the escrow key with the user's password.
   * It is important to note that this operation is performed at the end,
   * so that the escrow key is not encrypted when creating the account/key.
   *
   * @param user - The user whose escrow key is to be encrypted.
   * @param createUserDto - The data transfer object containing the user's details.
   */
  encryptEscrowKey(user: User, createUserDto: CreateUserDto) {
    if (createUserDto.encryptionKey) {
      user.escrowKey = this.keyService.encryptString(
        user.escrowKey,
        createUserDto.encryptionKey,
      );
    }
  }

  /**
   * This function saves the user entity to the database.
   * If an error occurs during the save operation, it is caught and logged,
   * and an InternalServerErrorException is thrown with the error message.
   *
   * @param user - The user entity to be saved.
   * @returns A promise that resolves to the saved user entity.
   * @throws {InternalServerErrorException} If an error occurs during the save operation.
   */
  async save(user: User): Promise<User> {
    return this.usersRepository.save(user).catch((err) => {
      console.error(err);
      throw new InternalServerErrorException(
        err.code || err.message || 'Error saving user',
      );
    });
  }
}
