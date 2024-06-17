import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'crypto';
import { KeyService } from 'src/key/key.service';
import { AccountService } from '../account/account.service';
import { CreateKeyDto } from './dto/create-key.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { Account } from 'src/account/account.entity';
import { Key } from 'src/key/key.entity';
import { FailedUserSaveError } from './error/failed-user-save.error';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly keyService: KeyService,
    private readonly accountService: AccountService,
  ) {}
  /**
   * This function returns all the users in the database.
   *
   * @returns A promise that resolves to an array of all the users in the database.
   */
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async getUser(userId: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { id: userId },
      relations: { accounts: { keys: true }, keys: true },
    });
  }

  async getUserAccounts(
    id: string,
  ): Promise<{ id: string; accounts: Account[] }> {
    const accounts = await this.accountService.findAccountsByUserId(id);
    return { id, accounts };
  }

  async getUserKeys(id: string): Promise<{ id: string; keys: Key[] }> {
    const keys = await this.keyService.findKeysByUserId(id);

    return { id, keys };
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

  async createAndSaveKey(
    user: User,
    createKeyDto: CreateKeyDto,
    encryptionKey?: string,
  ) {
    const escrowKey = this.handleDecryptEscrowKey(user, encryptionKey);
    const key = await this.keyService
      .create(escrowKey, createKeyDto.type)
      .addUser(user)
      .save();
    return key;
  }

  async createAndSaveAccount(
    user: User,
    createAccountDto: CreateAccountDto,
    encryptionKey?: string,
  ) {
    // check if alias is unique
    const accountAliasExists = await this.accountService.accountAliasExists(
      user.id,
      createAccountDto.alias,
    );
    if (accountAliasExists) throw new Error('Account alias already exists');

    const escrowKey = this.handleDecryptEscrowKey(user, encryptionKey);
    // create key and add to user
    const key = await this.keyService
      .create(escrowKey, createAccountDto.type)
      .addUser(user)
      .save();
    // create account and add to user
    const accountTransaction =
      await this.accountService.createTransactionAndExecute(
        { key, alias: createAccountDto.alias },
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
    this.logger.log({ createUserDto, location: 'user service' });
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
  // async handleKeyOrAccountCreation(user: User, createUserDto: CreateUserDto) {
  //   if (!createUserDto.withAccount && !createUserDto.withKey) {
  //     // logging for data tracking in future
  //     return this.logger.log('Only creating user');
  //   }

  //   const key = await this.keyService.create(user.escrowKey).save();
  //   user.keys = [key];
  //   // user.keys = Promise.resolve([key]);

  //   if (createUserDto.withAccount) {
  //     const accountTransaction =
  //       await this.accountService.createTransactionAndExecute(
  //         {
  //           key,
  //           initialBalance: createUserDto.network === Network.MAINNET ? 0 : 100,
  //         },
  //         createUserDto.network,
  //       );
  //     const account = await accountTransaction.save();
  //     user.accounts = [account];
  //     // user.accounts = Promise.resolve([account]);
  //   }
  // }

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
   * and an FailedUserSaveError is thrown with the error message.
   *
   * @param user - The user entity to be saved.
   * @returns A promise that resolves to the saved user entity.
   * @throws {FailedUserSaveError} If an error occurs during the save operation.
   */
  async save(user: User): Promise<User> {
    try {
      // await is needed to catch errors here
      return await this.usersRepository.save(user);
    } catch (err: any) {
      this.logger.error(err);
      throw new FailedUserSaveError(err.code || err.message);
    }
  }
}
