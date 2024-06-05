import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { NodeEnv } from './node-env.enum';
import { PrivateKey } from '@hashgraph/sdk';

export interface Configuration {
  app: AppConfiguration;
  db: DbConfiguration;
  hedera: HederaConfiguration;
}

export type DbConfiguration = MysqlConnectionOptions;

export interface AppConfiguration {
  env: NodeEnv;
  port: number;
  jwtSecret: string;
}

export interface HederaConfiguration {
  custodialKey: PrivateKey;
  testnet: HederaNetworkConfiguration;
  mainnet: HederaNetworkConfiguration;
}

export interface HederaNetworkConfiguration {
  id: string;
  key: string;
  mirrornodeUrl: string;
}
