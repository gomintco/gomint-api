import { Account } from '../account/account.entity';
import { ApiKey } from '../auth/api-key.entity';
import { Deal } from '../deal/deal.entity';
import { Key } from '../key/key.entity';
import { User } from '../user/user.entity';
import { DbConfiguration } from './configuration.type';
import { Env } from './env.schema';

export function getDBConfig(env: Env): DbConfiguration {
  return {
    type: 'mysql',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities: [User, Key, Account, ApiKey, Deal],
    logging: true,
    synchronize: false,
  };
}
