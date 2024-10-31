import { Test, TestingModule } from '@nestjs/testing';
import { ClientService } from './client.service';
import { AppConfigService } from 'src/config/app-config.service';
import { createMock } from '@golevelup/ts-jest';
import { KeyService } from 'src/key/key.service';

describe('ClientService', () => {
  let service: ClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: AppConfigService, useValue: createMock<AppConfigService>() },
        { provide: KeyService, useValue: createMock<KeyService>() },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
