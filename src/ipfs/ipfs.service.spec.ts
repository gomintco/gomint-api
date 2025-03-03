import { IpfsService } from './ipfs.service';
import { TestBed } from '@suites/unit';

describe('IpfsService', () => {
  let service: IpfsService;

  beforeEach(async () => {
    const { unit } = await TestBed.solitary(IpfsService).compile();
    service = unit;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
