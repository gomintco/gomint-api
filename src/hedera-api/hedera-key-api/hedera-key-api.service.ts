import { KeyList, PrivateKey } from '@hashgraph/sdk';
import { Injectable } from '@nestjs/common';
import { KeyType } from './key-type.enum';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class HederaKeyApiService {
  constructor(private readonly configService: AppConfigService) {}

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
    const publicKeyList = Array.from({ length: n }).map(
      () => this.generatePrivateKey(type).publicKey,
    );
    return new KeyList(publicKeyList, threshold);
  }

  generateGoMintKeyList(type: KeyType): {
    keyList: KeyList;
    privateKey: PrivateKey;
  } {
    const privateKey = this.generatePrivateKey(type);
    const keyList = new KeyList(
      [privateKey, this.configService.hedera.custodialKey],
      1,
    );
    return {
      keyList,
      privateKey,
    };
  }
}
