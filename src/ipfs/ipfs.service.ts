import { Injectable } from '@nestjs/common/index.js';
import { TokenMetadata } from 'src/token/dto/hip412-metadata.dto';
import { AppConfigService } from 'src/config/app-config.service';
import type { Client } from '@web3-storage/w3up-client';
import { TokenCollectionMetadata } from 'src/token/dto/hip766-metadata.dto';

@Injectable()
export class IpfsService {
  private client?: Client;

  constructor(private readonly configService: AppConfigService) {}

  async initClient(): Promise<void> {
    if (this.client) {
      return;
    }
    const { create } = await eval(`import('@web3-storage/w3up-client')`);
    const { parse } = await eval(`import('@ucanto/principal/ed25519')`);
    const { StoreMemory } = await eval(`import(
      '@web3-storage/w3up-client/stores/memory'
    )`);

    const principal = parse(this.configService.ipfs.web3StorageKey);
    const store = new StoreMemory();
    this.client = await create({ principal, store });
    const proof = await this.parseProof(
      this.configService.ipfs.web3StorageProof,
    );
    const space = await this.client.addSpace(proof);
    await this.client.setCurrentSpace(space.did());
  }

  async uploadMetadata(
    metadata: TokenMetadata | TokenCollectionMetadata,
  ): Promise<string> {
    await this.initClient();
    const blob = new Blob([JSON.stringify(metadata)]);
    const res = await this.client.uploadFile(blob);
    return 'ipfs://' + res.toString();
  }

  private async parseProof(data: string) {
    const { importDAG } = await eval(`import('@ucanto/core/delegation')`);
    const { CarReader } = await eval(`import('@ipld/car')`);
    const blocks = [];
    const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'));
    for await (const block of reader.blocks()) {
      blocks.push(block);
    }
    return importDAG(blocks);
  }
}
