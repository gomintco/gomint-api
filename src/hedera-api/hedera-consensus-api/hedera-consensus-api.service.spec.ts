import { Test, TestingModule } from '@nestjs/testing';
import { HederaConsensusApiService } from './hedera-consensus-api.service';

describe('HederaConsensusApiService', () => {
  let service: HederaConsensusApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaConsensusApiService],
    }).compile();

    service = module.get<HederaConsensusApiService>(HederaConsensusApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
