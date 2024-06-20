import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import * as crypto from 'crypto';
import { KeyService } from 'src/key/key.service';
import { AccountService } from '../account/account.service';
import { Account } from 'src/account/account.entity';
import { Key } from 'src/key/key.entity';
import { FailedUserSaveError, UserDuplicationError } from 'src/core/error';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly keyService: KeyService,
    private readonly accountService: AccountService,
  ) {}

  /**
   * This function returns all the users in the database.
   *
   * @returns A promise that resolves to an array of all the users in the database.
   */
  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getUser(userId: string): Promise<User> {
    return this.userRepository.findOne({
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
    return this.userRepository.findOneByOrFail({ username });
  }

  private handleDecryptEscrowKey(user: User, encryptionKey: string) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey) {
      escrowKey = this.keyService.decryptString(user.escrowKey, encryptionKey);
    }
    return escrowKey;
  }

  /**
   * This function creates a new user entity with the provided details.
   * It generates a random escrow key for the user and sets the `hasEncryptionKey` field based on whether an `encryptionKey` was provided.
   *
   * @param signUpDto - The data transfer object containing the user's details.
   * @returns The created user entity.
   */
  async create(signUpDto: SignUpDto): Promise<User> {
    try {
      const user = this.userRepository.create({
        network: signUpDto.network,
        username: signUpDto.username,
        hashedPassword: signUpDto.hashedPassword,
        escrowKey: crypto.randomBytes(16).toString('hex'),
        hasEncryptionKey: Boolean(signUpDto.encryptionKey),
        email: signUpDto.email,
      });
      this.encryptEscrowKey(user, signUpDto.encryptionKey);

      return await this.save(user);
    } catch (error: any) {
      if (error.message === 'ER_DUP_ENTRY') {
        throw new UserDuplicationError();
      }
      throw error;
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
  encryptEscrowKey(user: User, encryptionKey?: string) {
    if (encryptionKey) {
      user.escrowKey = this.keyService.encryptString(
        user.escrowKey,
        encryptionKey,
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
      return await this.userRepository.save(user);
    } catch (err: any) {
      this.logger.error(err);
      throw new FailedUserSaveError(err.code || err.message);
    }
  }
}
