import { ApiProperty } from '@nestjs/swagger';
import { AccountResponse } from './account.response';
import { Account } from '../account.entity';

export class AccountsResponse {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: AccountResponse, isArray: true })
  accounts: AccountResponse[];

  constructor(userId: string, accounts: Account[]) {
    this.id = userId;
    this.accounts = accounts.map((account) => new AccountResponse(account));
  }
}
