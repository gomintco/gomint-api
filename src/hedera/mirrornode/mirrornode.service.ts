import { Injectable } from '@nestjs/common';
import { TokenMirrornodeInfo } from './mirrornode.interface';
import { Network } from 'src/hedera/network.enum';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class MirrornodeService {
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
    }
    const res = await fetch(`${mirrornodeUrl}/tokens/${tokenId}`);
    const data = await res.json();
    return data as TokenMirrornodeInfo;
  }
}
