import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { Repository } from 'typeorm';
import { User } from 'src/user/user.entity';
import { getRandomValues } from 'crypto';
import { ApiKeyNotFound } from 'src/core/error';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeyRepository: Repository<ApiKey>,
  ) {}

  async generateApiKey(user: User): Promise<{ apiKey: string }> {
    try {
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

  async getUserApiKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeyRepository.findBy({ user: { id: userId } });
  }

  async deleteApiKey(id: number, userId: string): Promise<void> {
    const result = await this.apiKeyRepository.delete({
      id,
      user: { id: userId },
    });
    if (!result.affected) {
      throw new ApiKeyNotFound();
    }
  }

  async validateApiKey(key: string): Promise<User> {
    try {
      const apiKey = await this.apiKeyRepository.findOne({
        where: { key },
        relations: { user: true },
      });
      if (!apiKey) {
        throw new Error("API key doesn't exist");
      }
      if (!apiKey.user) {
        throw new Error('No user associated with the API key');
      }
      return apiKey.user;
    } catch (e: any) {
      throw new NotFoundException('Error validating API Key', {
        cause: e,
        description: e.message,
      });
    }
  }
}
