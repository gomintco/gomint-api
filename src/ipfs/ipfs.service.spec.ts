import { Test, TestingModule } from '@nestjs/testing';
import { IpfsService } from './ipfs.service';
import { AppConfigService } from '../config/app-config.service';
import { createMock } from '@golevelup/ts-jest';

describe('IpfsService', () => {
  let service: IpfsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IpfsService,
        {
          provide: AppConfigService,
          useValue: createMock<AppConfigService>(),
        },
      ],
    }).compile();

    service = module.get<IpfsService>(IpfsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
