import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';
import { DealModule } from './deal/deal.module';
import { AppConfigModule } from './config/app-config.module';
import { AppConfigService } from './config/app-config.service';
import { HederaModule } from './hedera-api/hedera-api.module';

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: async (configService: AppConfigService) => configService.db,
      inject: [AppConfigService],
    }),
    TokenModule,
    UserModule,
    DealModule,
    HederaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
