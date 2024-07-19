import { Injectable, Logger } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { SignUpDto } from './dto/sign-up.dto';
import { UserResponse } from 'src/user/response/user.response';
import { ApiKeyService } from './api-key.service';
import { ApiKey } from './api-key.entity';
import { JwtService } from '@nestjs/jwt';
import { UserNotFoundError, WrongPasswordError } from 'src/core/error';
import type { JwtPayload } from './jwt-payload.type';
import { User } from 'src/user/user.entity';

@Injectable()
export class AuthMediator {
  private readonly logger = new Logger(AuthMediator.name);

  constructor(
    private readonly userService: UserService,
    private readonly apiKeyService: ApiKeyService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Verifies user credentials and returns access token
   */
  async signIn(username: string, password: string): Promise<string> {
    let user: User;
    try {
      user = await this.userService.findOneByOrFail({ username });
      if (user?.hashedPassword !== password) {
        throw new WrongPasswordError();
      }
    } catch (err: any) {
      this.logger.error(err);
      throw new UserNotFoundError('User with such credentials is not found');
    }

    const payload: JwtPayload = { username: user.username, sub: user.id };
    return await this.jwtService.signAsync(payload);
  }

  async signup(signUpDto: SignUpDto): Promise<User> {
    return await this.userService.create(signUpDto);
  }

  async getAuthUser(userId: string): Promise<UserResponse> {
    const user = await this.userService.getUser(userId);
    return new UserResponse(user);
  }

  async getApiKeys(userId: string): Promise<ApiKey[]> {
    return this.apiKeyService.getUserApiKeys(userId);
  }

  async generateApiKey(userId: string): Promise<ApiKey> {
    const user = await this.userService.findOneByOrFail({ id: userId });
    return await this.apiKeyService.generateApiKey(user);
  }

  async deleteApiKey(userId: string, apiKeyId: number): Promise<void> {
    return await this.apiKeyService.deleteApiKey(userId, apiKeyId);
  }
}
