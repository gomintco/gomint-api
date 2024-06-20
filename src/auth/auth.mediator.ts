import { Injectable, Logger } from '@nestjs/common';
import { Network } from 'src/hedera-api/network.enum';
import { UserService } from 'src/user/user.service';
import { SignUpDto } from './dto/sign-up.dto';
import { UserResponse } from 'src/user/response/user.response';

@Injectable()
export class AuthMediator {
  private readonly logger = new Logger(AuthMediator.name);

  constructor(private readonly userService: UserService) {}

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
}
