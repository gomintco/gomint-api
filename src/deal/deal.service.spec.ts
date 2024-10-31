import { Test, TestingModule } from '@nestjs/testing';
import { DealService } from './deal.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Deal } from './deal.entity';
import { AccountService } from '../account/account.service';
import { KeyService } from '../key/key.service';
import { AppConfigService } from '../config/app-config.service';
import { Repository } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';

describe('DealService', () => {
  let service: DealService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DealService,
        {
          provide: getRepositoryToken(Deal),
          useValue: createMock<Repository<Deal>>(),
        },
        {
          provide: AccountService,
          useValue: createMock<AccountService>(),
        },
        {
          provide: KeyService,
          useValue: createMock<KeyService>(),
        },
        {
          provide: AppConfigService,
          useValue: createMock<AppConfigService>(),
        },
      ],
    }).compile();

    service = module.get<DealService>(DealService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
