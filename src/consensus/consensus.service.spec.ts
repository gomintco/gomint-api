import { Test, TestingModule } from '@nestjs/testing';
import { ConsensusService } from './consensus.service';

describe('ConsensusService', () => {
  let service: ConsensusService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConsensusService],
    }).compile();

    service = module.get<ConsensusService>(ConsensusService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
