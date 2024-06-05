import { Test, TestingModule } from '@nestjs/testing';
import { HederaAccountService } from './account.service';

describe('HederaAccountService', () => {
  let service: HederaAccountService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaAccountService],
    }).compile();

    service = module.get<HederaAccountService>(HederaAccountService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
