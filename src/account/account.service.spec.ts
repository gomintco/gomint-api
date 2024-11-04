import { TestBed } from '@suites/unit';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(async () => {
    const { unit } = await TestBed.solitary(AccountService).compile();
    service = unit;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
