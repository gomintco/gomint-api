import { ApiProperty } from '@nestjs/swagger';
import { Account } from 'src/account/account.entity';

export class AccountResponse {
  @ApiProperty()
  id: string;
  @ApiProperty()
  alias: string;
  @ApiProperty()
  createdAt: Date;

  constructor({ id, alias, createdAt }: Account) {
    this.id = id;
    this.alias = alias;
    this.createdAt = createdAt;
  }
}
