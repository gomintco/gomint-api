import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
// modules
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';
import { KeyModule } from './key/key.module';
// entities
import { User } from './user/user.entity';
import { Key } from './key/key.entity';
import { Account } from './account/account.entity';
import { ApiKey } from './auth/api-key.entity';
import { DealModule } from './deal/deal.module';
import { Deal } from './deal/deal.entity';
import { HederaModule } from './hedera/hedera.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Key, Account, ApiKey, Deal],
      synchronize: false,
    }),
    // KeyModule,
    TokenModule,
    UserModule,
    DealModule,
    HederaModule,
    // AccountModule,
    // ClientModule,
    // AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
