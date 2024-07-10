import { ApiProperty } from '@nestjs/swagger';
import { Account } from '../account.entity';
import { AccountUpdateDto } from '../dto';

export class AccountUpdateResponse {
  @ApiProperty()
  oldAlias: string;
  @ApiProperty()
  newAlias: string;

  constructor(oldEntity: Account, newEntity: AccountUpdateDto) {
    this.oldAlias = oldEntity.alias;
    this.newAlias = newEntity.alias;
  }
}
