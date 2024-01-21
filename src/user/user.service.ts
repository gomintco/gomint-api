import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as crypto from 'crypto';
import { KeyService } from 'src/key/key.service';
import { AccountService } from '../account/account.service';

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

  findOneByOrFail(id: string): Promise<User> {
    return this.usersRepository.findOneByOrFail({ id });
  }

  async findOne(id: string): Promise<User> {
    return await this.usersRepository.findOneByOrFail({ id });
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
      escrowKey: crypto.randomBytes(16).toString('hex'),
      hasPassword: Boolean(createUserDto.password),
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
    user.keys = Promise.resolve([key]);

    if (createUserDto.withAccount) {
      const accountTransaction =
        await this.accountService.createTransactionAndExecute(
          { key },
          createUserDto.network,
        );
      const account = await accountTransaction.save();
      user.accounts = Promise.resolve([account]);
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
    if (createUserDto.password) {
      user.escrowKey = this.keyService.encryptString(
        user.escrowKey,
        createUserDto.password,
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
