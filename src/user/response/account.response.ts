import { Account } from 'src/account/account.entity';

export class AccountResponse {
  id: string;
  alias: string;
  createdAt: Date;

  constructor({ id, alias, createdAt }: Account) {
    this.id = id;
    this.alias = alias;
    this.createdAt = createdAt;
  }
}
