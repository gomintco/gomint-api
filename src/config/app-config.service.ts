import { ConfigService } from '@nestjs/config';
import {
  AppConfiguration,
  Configuration,
  DbConfiguration,
  HederaConfiguration,
} from './configuration.type';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<Configuration>) {}

  public get app(): AppConfiguration {
    return this.configService.get<AppConfiguration>('app', { infer: true });
  }

  public get hedera(): HederaConfiguration {
    return this.configService.get<HederaConfiguration>('hedera');
  }

  public get db(): DbConfiguration {
    return this.configService.get<DbConfiguration>('db');
  }
}
