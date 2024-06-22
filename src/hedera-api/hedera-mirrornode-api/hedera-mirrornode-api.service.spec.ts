import { Test, TestingModule } from '@nestjs/testing';
import { HederaMirrornodeApiService } from './hedera-mirrornode-api.service';

describe('HederaMirrornodeApiService', () => {
  let service: HederaMirrornodeApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaMirrornodeApiService],
    }).compile();

    service = module.get<HederaMirrornodeApiService>(
      HederaMirrornodeApiService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
