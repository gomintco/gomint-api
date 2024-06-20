import {
  Logger,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { EncryptedKeyPair } from './key.interface';
import { PrivateKey } from '@hashgraph/sdk';
import { KeyType } from 'src/key/key-type.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Key } from './key.entity';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import * as crypto from 'crypto';
import {
  DecryptionFailedError,
  EncryptionKeyNotProvidedError,
  InvalidKeyTypeError,
} from 'src/core/error';

@Injectable()
export class KeyService {
  private readonly logger = new Logger(KeyService.name);

  constructor(
    @InjectRepository(Key)
    private readonly keysRepository: Repository<Key>,
  ) {}

  async findKeysByUserId(id: string): Promise<Key[]> {
    return this.keysRepository.find({
      where: { user: { id } },
    });
  }

  async attachUserToKey(
    type: KeyType,
    privateKey: PrivateKey,
    escrowKey: string,
    user: User,
  ) {
    const key = new Key();
    key.type = type;
    key.publicKey = privateKey.publicKey.toString();

    const encryptedPrivateKey = this.encryptString(
      privateKey.toString(),
      escrowKey,
    );
    key.encryptedPrivateKey = encryptedPrivateKey;
    key.user = user;
    await this.keysRepository.save(key);
    return key;
  }

  /**
   * This function creates a new key builder with the provided escrow key and key type.
   * It generates an encrypted key pair based on the key type and creates a new key entity with the encrypted key pair.
   * The created key entity is not saved to the database.
   *
   * @param escrowKey - The escrow key to be used for encryption.
   * @param type - The type of the key to be created. Default is ED25519.
   * @returns A new key builder with the created key entity.
   * @throws {Error} If the provided key type is not supported.
   */
  create(
    escrowKey: User['escrowKey'],
    type: KeyType = KeyType.ED25519,
  ): KeyBuilder {
    let encryptedKeyPair: EncryptedKeyPair;
    switch (type) {
      case KeyType.ED25519:
        encryptedKeyPair = this.createEncryptedED25519KeyPair(escrowKey);
        break;
      case KeyType.ECDSA:
        encryptedKeyPair = this.createEncryptedECSDAKeyPair(escrowKey);
        break;
      default:
        throw new Error('Key type not supported');
    }
    const key = this.keysRepository.create({ ...encryptedKeyPair });
    return new KeyBuilder(this, key);
  }

  /**
   * This function saves the key entity to the database.
   * If an error occurs during the save operation, it is caught and logged,
   * and an InternalServerErrorException is thrown with the error message.
   *
   * @param key - The key entity to be saved.
   * @returns A promise that resolves to the saved key entity.
   * @throws {InternalServerErrorException} If an error occurs during the save operation.
   */
  async save(key: Key): Promise<Key> {
    return this.keysRepository.save(key).catch((err) => {
      this.logger.error(err);
      throw new InternalServerErrorException('Error saving key', {
        cause: err,
        description: err.code || err.message,
      });
    });
  }

  /**
   * This function creates an encrypted ED25519 key pair with the provided encryption key.
   * It generates a new private key and encrypts it with the encryption key.
   *
   * @param encryptionKey - The key to be used for encryption.
   * @returns An encrypted key pair.
   */
  private createEncryptedED25519KeyPair(
    encryptionKey: string,
  ): EncryptedKeyPair {
    const privateKey = PrivateKey.generateED25519();
    const publicKey = privateKey.publicKey;
    const encryptedPrivateKey = this.encryptString(
      privateKey.toString(),
      encryptionKey,
    );
    return {
      type: KeyType.ED25519,
      publicKey: publicKey.toString(),
      encryptedPrivateKey: encryptedPrivateKey,
    };
  }

  /**
   * This function creates an encrypted ECDSA key pair with the provided encryption key.
   * It generates a new private key and encrypts it with the encryption key.
   *
   * @param encryptionKey - The key to be used for encryption.
   * @returns An encrypted key pair.
   */
  private createEncryptedECSDAKeyPair(encryptionKey: string): EncryptedKeyPair {
    const privateKey = PrivateKey.generateECDSA();
    const publicKey = privateKey.publicKey;
    const encryptedPrivateKey = this.encryptString(
      privateKey.toString(),
      encryptionKey,
    );
    return {
      type: KeyType.ECDSA,
      publicKey: publicKey.toString(),
      encryptedPrivateKey: encryptedPrivateKey,
    };
  }

  /**
   * This function encrypts a string with the provided encryption key.
   * It generates a hash of the encryption key and a random initialization vector,
   * and uses them to create a cipher for the encryption.
   *
   * @param value - The string to be encrypted.
   * @param encryptionKey - The key to be used for encryption.
   * @returns The encrypted string, combined with the initialization vector.
   */
  encryptString(value: string, encryptionKey: string): string {
    const keyHash = crypto
      .createHash('sha256')
      .update(encryptionKey)
      .digest('base64')
      .substring(0, 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(keyHash),
      iv,
    );
    let encrypted = cipher.update(value);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex'); // Combine IV and encrypted data
  }

  decryptUserEscrowKey(user: User, encryptionKey?: string): string {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey) {
      escrowKey = this.decryptString(user.escrowKey, encryptionKey);
    }
    return escrowKey;
  }

  decryptAccountKeys(
    encryptedPrivateKey: Key[],
    escrowKey: string,
  ): PrivateKey[] {
    return encryptedPrivateKey.map((key) => {
      const decryptedKey = this.decryptString(
        key.encryptedPrivateKey,
        escrowKey,
      );

      switch (key.type) {
        case KeyType.ED25519:
          return PrivateKey.fromStringED25519(decryptedKey);
        case KeyType.ECDSA:
          return PrivateKey.fromStringECDSA(decryptedKey);
        default:
          throw new InvalidKeyTypeError();
      }
    });
  }

  /**
   * This function decrypts a string with the provided encryption key.
   * It splits the encrypted string into the initialization vector and the encrypted data,
   * generates a hash of the encryption key, and uses them to create a decipher for the decryption.
   *
   * @param encryptedValue - The string to be decrypted, combined with the initialization vector.
   * @param encryptionKey - The key to be used for decryption.
   * @returns The decrypted string.
   */
  decryptString(encryptedValue: string, encryptionKey?: string): string {
    if (!encryptionKey) {
      // user will need to use proxy server if they want to use their escrow key
      throw new EncryptionKeyNotProvidedError();
    }
    try {
      const components = encryptedValue.split(':');
      const iv = Buffer.from(components.shift(), 'hex');
      const encryptedText = Buffer.from(components.join(':'), 'hex');
      const keyHash = crypto
        .createHash('sha256')
        .update(encryptionKey)
        .digest('base64')
        .substring(0, 32);
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(keyHash),
        iv,
      );
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      return decrypted.toString();
    } catch (err: any) {
      this.logger.error('Error decrypting string', err);
      throw new DecryptionFailedError(
        'Decryption failed, check encryption key',
      );
    }
  }
}

class KeyBuilder {
  constructor(
    private readonly keyService: KeyService,
    private readonly key: Key,
  ) {}

  addUser(user: User) {
    // maybe throw error if key already has user
    this.key.user = user;
    return this;
  }

  async save(): Promise<Key> {
    return this.keyService.save(this.key);
  }

  get type(): Key['type'] {
    return this.key.type;
  }
}
