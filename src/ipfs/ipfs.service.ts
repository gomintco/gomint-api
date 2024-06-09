import { Injectable } from '@nestjs/common/index.js';
import { AppConfigService } from 'src/config/app-config.service.js';
import { TokenMetadata } from 'src/token/dto/hip412-metadata.dto.js';
import type { HeliaLibp2p } from 'helia';
//import { json } from '@helia/json'

@Injectable()
export class IpfsService {
  private client?: any;
  private helia?: HeliaLibp2p;

  constructor(private readonly configService: AppConfigService) { }

  //async initClient(): Promise<void> {
  //  if (this.client) return;
  //    const { create } = await import("@web3-storage/w3up-client");
  //const { parse } = await import("@ucanto/principal/ed25519");
  //  const { StoreMemory } = await import(
  //    '@web3-storage/w3up-client/stores/memory'
  //  );
  //
  //  const principal = parse(this.configService.ipfs.web3StorageKey);
  //  const store = new StoreMemory();
  //  this.client = await create({ principal, store });
  //  const proof = await this.parseProof(
  //    this.configService.ipfs.web3StorageProof,
  //  );
  //  const space = await this.client.addSpace(proof);
  //  await this.client.setCurrentSpace(space.did());
  //}

  async getHelia(): Promise<HeliaLibp2p> {
    if (this.helia == null) {
      const { createHelia } = await import('helia');
      this.helia = await createHelia();
    }

    return this.helia;
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.helia != null) {
      await this.helia.stop();
    }
  }

  async uploadHip412Metadata(metadata: TokenMetadata): Promise<string> {
    const helia = await this.getHelia()
    //const j =  json(helia)
    //const cid = await j.add(metadata)
    //return cid.toString()
    return "hello"
  }

  //async uploadHip412Metadata2(metadata: TokenMetadata): Promise<string> {
  //  //await this.initClient();
  //  const { create } = await import('@web3-storage/w3up-client');
  //  const { parse } = await import('@ucanto/principal/ed25519');
  //  const { StoreMemory } = await import(
  //    '@web3-storage/w3up-client/stores/memory'
  //  );
  //
  //  const principal = parse(this.configService.ipfs.web3StorageKey);
  //  const store = new StoreMemory();
  //  const client = await create({ principal, store });
  //  const proof = await parseProof(this.configService.ipfs.web3StorageProof);
  //  const space = await client.addSpace(proof);
  //  await client.setCurrentSpace(space.did());
  //
  //  const blob = new Blob([JSON.stringify(metadata)]);
  //  const res = await this.client.uploadFile(blob);
  //  return res.toString();
  //}

  //private async parseProof(data: string) {
  //  const { importDAG } = await import('@ucanto/core/delegation');
  //  const { CarReader } = await import('@ipld/car');
  //  const blocks = [];
  //  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'));
  //  for await (const block of reader.blocks()) {
  //    blocks.push(block);
  //  }
  //  return importDAG(blocks);
  //}
}

//async function parseProof(data: string) {
//  const { importDAG } = await import('@ucanto/core/delegation');
//  const { CarReader } = await import('@ipld/car');
//  const blocks = [];
//  const reader = await CarReader.fromBytes(Buffer.from(data, 'base64'));
//  for await (const block of reader.blocks()) {
//    blocks.push(block);
//  }
//  return importDAG(blocks);
//}
