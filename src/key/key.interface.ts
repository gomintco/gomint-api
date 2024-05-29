import { KeyType } from 'src/key/key-type.enum';

export interface EncryptedKeyPair {
  type: KeyType;
  publicKey: string;
  encryptedPrivateKey: string;
}
