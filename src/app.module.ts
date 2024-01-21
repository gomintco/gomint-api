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
import { AccountModule } from './account/account.module';
import { ClientService } from './client/client.service';
import { ClientModule } from './client/client.module';
import { Account } from './account/account.entity';

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
      entities: [User, Key, Account],
      synchronize: true,
    }),
    KeyModule,
    TokenModule,
    UserModule,
    AccountModule,
    ClientModule,
  ],
  controllers: [],
  providers: [ClientService],
})
export class AppModule {}
