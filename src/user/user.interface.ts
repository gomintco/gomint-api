import { KeyType } from 'src/app.interface';

export interface CleanedKey {
  type: KeyType;
  publicKey: string;
}

export interface CleanedAccount {
  id: string;
  keys: CleanedKey[];
}

export interface CleanedUser {
  id: string;
  username: string;
  network: string;
  keys: CleanedKey[];
  accounts: CleanedAccount[];
}
