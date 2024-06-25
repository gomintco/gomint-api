import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { NodeEnv } from './node-env.enum';
import { PrivateKey } from '@hashgraph/sdk';

export interface Configuration {
  app: AppConfiguration;
  db: DbConfiguration;
  hedera: HederaConfiguration;
  ipfs: IpfsConfiguration;
}

export type DbConfiguration = MysqlConnectionOptions;

export interface AppConfiguration {
  env: NodeEnv;
  port: number;
  jwtSecret: string;
  jwtExpiresIn: string;
}

export interface HederaConfiguration {
  testnet: HederaNetworkConfiguration;
  mainnet: HederaNetworkConfiguration;
}

export interface HederaNetworkConfiguration {
  id: string;
  key: string;
  mirrornodeUrl: string;
  custodialKey: PrivateKey;
}

export interface IpfsConfiguration {
  web3StorageKey: string;
  web3StorageProof: string;
}
