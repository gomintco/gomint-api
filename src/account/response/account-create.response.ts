import { ApiProperty } from '@nestjs/swagger';

export class AccountCreateResponse {
  @ApiProperty()
  accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
  }
}
