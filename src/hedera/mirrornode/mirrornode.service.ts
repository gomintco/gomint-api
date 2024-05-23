import { Injectable } from '@nestjs/common';
import { TokenMirrornodeInfo } from './mirrornode.interface';
import { Network } from 'src/app.interface';
import { MAINNET_MIRRONODE_URL, TESTNET_MIRRONODE_URL } from 'src/app.config';

@Injectable()
export class MirrornodeService {
  async getTokenMirronodeInfo(
    network: Network,
    tokenId: string,
  ): Promise<TokenMirrornodeInfo> {
    let mirrornodeUrl = '';
    switch (network) {
      case Network.TESTNET:
        mirrornodeUrl = TESTNET_MIRRONODE_URL;
        break;
      case Network.MAINNET:
        mirrornodeUrl = MAINNET_MIRRONODE_URL;
        break;
    }
    const res = await fetch(`${mirrornodeUrl}/tokens/${tokenId}`);
    const data = await res.json();
    return data as TokenMirrornodeInfo;
  }
}
