import { Account } from 'src/account/account.entity';
import { KeyResponse } from './key.response';

export class AccountResponse {
  id: string;
  alias: string;
  createdAt: Date;
  //keys: KeyResponse[];

  constructor({ id, alias, keys, createdAt }: Account) {
    this.id = id;
    this.alias = alias;
    this.createdAt = createdAt;
    //this.keys = keys.map((key) => new KeyResponse(key));
  }
}
