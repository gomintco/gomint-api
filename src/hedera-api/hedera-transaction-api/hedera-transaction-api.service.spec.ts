import { Test, TestingModule } from '@nestjs/testing';
import { HederaTransactionApiService } from './hedera-transaction-api.service';

describe('HederaTransactionApiService', () => {
  let service: HederaTransactionApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaTransactionApiService],
    }).compile();

    service = module.get<HederaTransactionApiService>(HederaTransactionApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
