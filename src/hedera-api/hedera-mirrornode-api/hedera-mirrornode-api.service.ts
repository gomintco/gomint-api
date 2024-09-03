import { Injectable } from '@nestjs/common';
import { TokenMirrornodeInfo } from './hedera-mirrornode-api.interface';
import { Network } from 'src/hedera-api/network.enum';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class HederaMirrornodeApiService {
  constructor(private readonly configService: AppConfigService) {}

  async getTokenMirrornodeInfo(
    network: Network,
    tokenId: string,
  ): Promise<TokenMirrornodeInfo> {
    let mirrornodeUrl = '';
    switch (network) {
      case Network.TESTNET:
        mirrornodeUrl = this.configService.hedera.testnet.mirrornodeUrl;
        break;
      case Network.MAINNET:
        mirrornodeUrl = this.configService.hedera.mainnet.mirrornodeUrl;
        break;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
    const res = await fetch(`${mirrornodeUrl}/tokens/${tokenId}`);
    const data = await res.json();
    return data as TokenMirrornodeInfo;
  }
}
