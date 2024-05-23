import { Test, TestingModule } from '@nestjs/testing';
import { MirrornodeService } from './mirrornode.service';

describe('MirrornodeService', () => {
  let service: MirrornodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MirrornodeService],
    }).compile();

    service = module.get<MirrornodeService>(MirrornodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
