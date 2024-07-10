import { ApiProperty } from '@nestjs/swagger';
import { User } from '../user.entity';
import { AccountResponse } from './account.response';
import { KeyResponse } from './key.response';

export class UserResponse {
  @ApiProperty()
  id: string;
  @ApiProperty()
  username: string;
  @ApiProperty()
  network: string;
  @ApiProperty({ type: KeyResponse, isArray: true })
  keys: KeyResponse[];
  @ApiProperty({ type: AccountResponse, isArray: true })
  accounts: AccountResponse[];

  constructor({ id, username, network, accounts, keys }: User) {
    this.id = id;
    this.username = username;
    this.network = network;
    this.keys = keys.map((key) => new KeyResponse(key));
    this.accounts = accounts.map((account) => new AccountResponse(account));
  }
}
