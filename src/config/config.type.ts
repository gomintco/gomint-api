import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions';

export interface ConfigurationType {
  port: number;
  db: MysqlConnectionOptions;
  hedera: {
    testNet: {
      id: string;
      key: string;
    };
    mainNet: {
      id: string;
      key: string;
    };
  };
}
