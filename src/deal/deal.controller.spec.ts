import { TestBed } from '@suites/unit';
import { DealController } from './deal.controller';

describe('DealController', () => {
  let controller: DealController;

  beforeEach(async () => {
    const { unit } = await TestBed.solitary(DealController).compile();
    controller = unit;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
