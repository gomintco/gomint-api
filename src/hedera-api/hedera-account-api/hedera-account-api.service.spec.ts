import { Test, TestingModule } from '@nestjs/testing';
import { HederaAccountApiService } from './hedera-account-api.service';

describe('HederaAccountApiService', () => {
  let service: HederaAccountApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaAccountApiService],
    }).compile();

    service = module.get<HederaAccountApiService>(HederaAccountApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
