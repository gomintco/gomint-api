import { KeyType } from 'src/key/key-type.enum';
import { Key } from 'src/key/key.entity';

export class KeyResponse {
  type: KeyType;
  publicKey: string;

  constructor({ type, publicKey }: Key) {
    this.type = type;
    this.publicKey = publicKey;
  }
}
