import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOneOptions, FindOptionsWhere, Repository } from 'typeorm';
import { User } from './user.entity';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import * as crypto from 'crypto';
import { KeyService } from 'src/key/key.service';
import { UserDuplicationError, UserNotFoundError } from 'src/core/error';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly keyService: KeyService,
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

  findOneByUsername(username: string): Promise<User> {
    return this.userRepository.findOneByOrFail({ username });
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

      return await this.userRepository.save(user);
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

  async findOneByOrFail(
    where: FindOptionsWhere<User> | FindOptionsWhere<User>[],
  ): Promise<User> {
    const user = await this.userRepository.findOneBy(where);

    if (!user) {
      throw new UserNotFoundError();
    }

    return user;
  }
}
