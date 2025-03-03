import { AccountController } from './account.controller';
import { TestBed } from '@suites/unit';

describe('AccountController', () => {
  let controller: AccountController;

  beforeEach(async () => {
    const { unit } = await TestBed.solitary(AccountController).compile();
    controller = unit;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
