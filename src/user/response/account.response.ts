import { Account } from 'src/account/account.entity';
import { KeyResponse } from './key.response';

export class AccountResponse {
  id: string;
  alias: string;
  keys: KeyResponse[];

  constructor({ id, alias, keys }: Account) {
    this.id = id;
    this.alias = alias;
    this.keys = keys.map((key) => new KeyResponse(key));
  }
}
