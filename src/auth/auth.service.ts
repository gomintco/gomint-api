import { Injectable, NotFoundException } from '@nestjs/common';
// auth.service.ts
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { Repository } from 'typeorm';
import { getRandomValues } from 'crypto';
import { User } from 'src/user/user.entity';
import { WrongPasswordError } from './error/wrong-password.error';
import { UserNotFoundError } from './error/user-not-found.error';
import { JwtPayload } from './jwt-payload.type';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    try {
      const user = await this.userRepository.findOneByOrFail({ username });
      if (user?.hashedPassword !== pass) {
        throw new WrongPasswordError();
      }

      const payload: JwtPayload = { username: user.username, sub: user.id };

      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (e: any) {
      throw new UserNotFoundError("User doesn't exist", {
        cause: e,
        description: e.message,
      });
    }
  }

  async generateApiKey(userId: string): Promise<{ apiKey: string }> {
    try {
      const user = await this.userRepository.findOneByOrFail({ id: userId });
      const apiKey = new ApiKey();
      apiKey.key = this.generateCryptoSecureKey();
      apiKey.user = user;
      await this.apiKeyRepository.save(apiKey);
      return { apiKey: apiKey.key };
    } catch (e: any) {
      throw new NotFoundException("User doesn't exist", {
        cause: e,
        description: e.message,
      });
    }
  }

  async validateApiKey(key: string): Promise<User> {
    try {
      const apiKey = await this.apiKeyRepository.findOne({
        where: { key },
        relations: { user: true },
      });
      if (!apiKey) throw new Error("API key doesn't exist");
      if (!apiKey.user) throw new Error('No user associated with the API key');
      return apiKey.user;
    } catch (e: any) {
      throw new NotFoundException('Error validating API Key', {
        cause: e,
        description: e.message,
      });
    }
  }

  // private generateCryptoSecureKey(length = 32) {
  //   // Ensure the length is an integer and at least 1
  //   length = Math.max(1, Math.floor(length));
  //   // Generate a buffer with cryptographically strong random bytes
  //   const buffer = crypto.randomBytes(length);
  //   // Convert the buffer to a hexadecimal string
  //   return Array.from(buffer, (byte) =>
  //     byte.toString(16).padStart(2, '0'),
  //   ).join('');
  // }

  private generateCryptoSecureKey(length = 32) {
    // Ensure the length is an integer and at least 1
    length = Math.max(1, Math.floor(length));
    // Create a Uint8Array of the desired length
    const array = new Uint8Array(length);
    // Populate the array with cryptographically strong random values
    getRandomValues(array);
    // Convert the array to a hexadecimal string
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }
}
