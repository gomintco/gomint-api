import { Account } from '../account.entity';
import { AccountUpdateDto } from '../dto';

export class AccountUpdateResponse {
  oldAlias: string;
  newAlias: string;

  constructor(oldEntity: Account, newEntity: AccountUpdateDto) {
    this.oldAlias = oldEntity.alias;
    this.newAlias = newEntity.alias;
  }
}
