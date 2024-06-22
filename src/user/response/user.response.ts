import { User } from '../user.entity';
import { AccountResponse } from './account.response';
import { KeyResponse } from './key.response';

export class UserResponse {
  id: string;
  username: string;
  network: string;
  keys: KeyResponse[];
  accounts: AccountResponse[];

  constructor({ id, username, network, accounts, keys }: User) {
    this.id = id;
    this.username = username;
    this.network = network;
    this.keys = keys.map((key) => new KeyResponse(key));
    this.accounts = accounts.map((account) => new AccountResponse(account));
  }
}
