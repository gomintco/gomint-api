import { Injectable } from '@nestjs/common/index.js';
import { TokenMetadata } from 'src/token/dto/hip412-metadata.dto';
import { AppConfigService } from 'src/config/app-config.service';
import type { Client } from '@web3-storage/w3up-client';
import { TokenCollectionMetadata } from 'src/token/dto/hip766-metadata.dto';

@Injectable()
export class IpfsService {
  private client?: Client;

  constructor(private readonly configService: AppConfigService) { }

  async initClient(): Promise<void> {
    if (this.client) {
      return;
    }
    const { Signer } = await eval(`import('@ucanto/principal/ed25519')`);
    const { StoreMemory } = await eval(`import(
      '@web3-storage/w3up-client/stores/memory'
    )`);
    const { create } = await eval(`import('@web3-storage/w3up-client')`);
    const { parse } = await eval(`import('@web3-storage/w3up-client/proof')`);

    const principal = Signer.parse(this.configService.ipfs.web3StorageKey);
    const store = new StoreMemory();
    const client = await create({ principal, store });
    const proof = await parse(this.configService.ipfs.web3StorageProof);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());
    this.client = client;
  }

  async uploadMetadata(
    metadata: TokenMetadata | TokenCollectionMetadata,
  ): Promise<string> {
    await this.initClient();
    const blob = new Blob([JSON.stringify(metadata)]);
    const res = await this.client.uploadFile(blob);
    return 'ipfs://' + res.toString();
  }
}
