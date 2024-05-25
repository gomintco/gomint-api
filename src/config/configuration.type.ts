import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { NodeEnv } from './node-env.enum';

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
  testnet: HederaNetworkConfiguration;
  mainnet: HederaNetworkConfiguration;
}

export interface HederaNetworkConfiguration {
  id: string;
  key: string;
  mirrornodeUrl: string;
}
