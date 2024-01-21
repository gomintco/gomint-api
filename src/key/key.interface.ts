import { KeyType } from '../app.interface';

export interface EncryptedKeyPair {
  type: KeyType;
  publicKey: string;
  encryptedPrivateKey: string;
}
