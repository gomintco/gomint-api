import { DataSource } from 'typeorm';
import { getDBConfig } from 'src/config/db-config';
import { validate } from 'src/config/validation';

const env = validate(process.env);
export const migrationsDataSource = new DataSource({
  ...getDBConfig(env),
  migrations: ['src/db/seeds/*.ts'],
  migrationsTableName: 'seeds',
});
