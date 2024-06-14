import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';
import { DealModule } from './deal/deal.module';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { HederaModule } from './hedera-api/hedera-api.module';
import { DbLogger } from './db/db-logger.service';
import { AppLoggerModule } from './core/app-logger.module';

@Module({
  imports: [
    AppConfigModule,
    AppLoggerModule,
    TypeOrmModule.forRootAsync({
      useFactory: async (
        configService: AppConfigService,
        logger: DbLogger,
      ) => ({ ...configService.db, logger }),
      extraProviders: [DbLogger],
      inject: [AppConfigService, DbLogger],
    }),
    TokenModule,
    UserModule,
    DealModule,
    HederaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
