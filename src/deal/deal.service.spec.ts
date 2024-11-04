import { DealService } from './deal.service';
import { TestBed } from '@suites/unit';

describe('DealService', () => {
  let service: DealService;

  beforeEach(async () => {
    const { unit } = await TestBed.solitary(DealService).compile();
    service = unit;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
