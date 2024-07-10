import { Injectable, Logger } from '@nestjs/common';
import { Network } from 'src/hedera-api/network.enum';
import { UserService } from 'src/user/user.service';
import { SignUpDto } from './dto/sign-up.dto';
import { UserResponse } from 'src/user/response/user.response';
import { ApiKeyService } from './api-key.service';
import { ApiKey } from './api-key.entity';
import { JwtService } from '@nestjs/jwt';
import { UserNotFoundError, WrongPasswordError } from 'src/core/error';
import type { JwtPayload } from './jwt-payload.type';

@Injectable()
export class AuthMediator {
  private readonly logger = new Logger(AuthMediator.name);

  constructor(
    private readonly userService: UserService,
    private readonly apiKeyService: ApiKeyService,
    private readonly jwtService: JwtService,
  ) { }

  async signIn(
    username: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    try {
      const user = await this.userService.findOneByOrFail({ username });
      if (user?.hashedPassword !== pass) {
        throw new WrongPasswordError();
      }

      const payload: JwtPayload = { username: user.username, sub: user.id };

      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (err: any) {
      this.logger.error(err);
      throw new UserNotFoundError('User with such credentials is not found');
    }
  }

  async signup(
    signUpDto: SignUpDto,
  ): Promise<{ username: string; id: string; network: Network }> {
    const { username, id, network } = await this.userService.create(signUpDto);

    return { username, id, network };
  }

  async getAuthUser(userId: string): Promise<UserResponse> {
    const user = await this.userService.getUser(userId);
    return new UserResponse(user);
  }

  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeyService.getUserApiKeys(userId);
  }

  async generateApiKey(userId: string) {
    const user = await this.userService.findOneByOrFail({ id: userId });
    return await this.apiKeyService.generateApiKey(user);
  }

  async deleteApiKey(userId: string, apiKeyId: number): Promise<void> {
    return await this.apiKeyService.deleteApiKey(userId, apiKeyId);
  }
}
