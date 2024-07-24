import { ApiProperty } from '@nestjs/swagger';
import { Network } from 'src/hedera-api/network.enum';
import { User } from 'src/user/user.entity';

export class SignUpResponse {
  @ApiProperty()
  username: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  network: Network;

  constructor(user: User) {
    this.username = user.username;
    this.id = user.id;
    this.network = user.network;
  }
}
