import { KeyList, PrivateKey } from '@hashgraph/sdk';
import { Injectable } from '@nestjs/common';
import { KeyType } from './key-type.enum';

@Injectable()
export class KeyService {
  generateED25519(): PrivateKey {
    return PrivateKey.generateED25519();
  }

  generateECDSA(): PrivateKey {
    return PrivateKey.generateECDSA();
  }

  generatePrivateKey(type: KeyType) {
    switch (type) {
      case KeyType.ED25519:
        return this.generateED25519();
      case KeyType.ECDSA:
        return this.generateECDSA();
      default:
        throw new Error('Unsupported key type');
    }
  }

  generateKeyList(n: number, type: KeyType, threshold?: number): KeyList {
    const publicKeyList = new Array(n).map(
      () => this.generatePrivateKey(type).publicKey,
    );
    return new KeyList(publicKeyList, threshold);
  }
}
