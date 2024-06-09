import { Test, TestingModule } from '@nestjs/testing';
import { HederaTokenApiService } from './hedera-token-api.service';

describe('HederaTokenApiService', () => {
  let service: HederaTokenApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaTokenApiService],
    }).compile();

    service = module.get<HederaTokenApiService>(HederaTokenApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
