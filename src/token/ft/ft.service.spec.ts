import { Test, TestingModule } from '@nestjs/testing';
import { FtService } from './ft.service';

describe('FtService', () => {
  let service: FtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FtService],
    }).compile();

    service = module.get<FtService>(FtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
