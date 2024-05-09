import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';
import { Account } from '../account/account.entity';
import { ApiKey } from '../auth/api-key.entity';
import { Deal } from '../deal/deal.entity';
import { Key } from '../key/key.entity';
import { User } from '../user/user.entity';

console.log(process.env.DB_USERNAME, process.env.DB_PORT);

const dataSource: MysqlConnectionOptions = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Key, Account, ApiKey, Deal],
  synchronize: false,
};

export default dataSource;
