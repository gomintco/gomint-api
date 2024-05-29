import { KeyType } from 'src/app.interface';
import { Key } from 'src/key/key.entity';

export class KeyResponse {
  type: KeyType;
  publicKey: string;

  constructor({ type, publicKey }: Key) {
    this.type = type;
    this.publicKey = publicKey;
  }
}
