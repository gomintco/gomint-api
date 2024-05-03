import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
// auth.service.ts
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { ApiKey } from './api-key.entity';
import { Repository } from 'typeorm';
import { getRandomValues } from 'crypto';
import { User } from 'src/user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async signIn(username: string, pass: string): Promise<any> {
    try {
      const user = await this.userRepository.findOneByOrFail({ username });
      if (user?.hashedPassword !== pass) {
        throw new UnauthorizedException();
      }
      const { hashedPassword, escrowKey, ...result } = user;

      const payload = { username: user.username, sub: user.id };

      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (e) {
      throw new NotFoundException("User doesn't exist", {
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
    } catch (e) {
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
        relations: ['user'],
      });
      if (!apiKey) throw new Error("API key doesn't exist");
      return apiKey.user;
    } catch (e) {
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
