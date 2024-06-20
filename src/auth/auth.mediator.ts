import { Injectable, Logger } from '@nestjs/common';
import { Network } from 'src/hedera-api/network.enum';
import { UserService } from 'src/user/user.service';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthMediator {
  private readonly logger = new Logger(AuthMediator.name);

  constructor(private readonly userService: UserService) {}

  async register(
    signUpDto: SignUpDto,
  ): Promise<{ username: string; id: string; network: Network }> {
      const { username, id, network } =
        await this.userService.create(signUpDto);

      return { username, id, network };
  }
}
