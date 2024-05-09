import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { TokenModule } from './token/token.module';
import { DealModule } from './deal/deal.module';
import configuration from './config/configuration';
import { validate } from './config/validation';
import { ConfigurationType } from './config/config.type';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService<ConfigurationType, true>) => {
        const config = configService.get<ConfigurationType['db']>('db');
        console.log(config);
        return config;
      },
      inject: [ConfigService],
    }),
    TokenModule,
    UserModule,
    DealModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
