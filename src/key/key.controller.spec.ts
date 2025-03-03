import { KeyController } from './key.controller';
import { TestBed } from '@suites/unit';

describe('KeyController', () => {
  let controller: KeyController;

  beforeEach(async () => {
    const { unit } = await TestBed.solitary(KeyController).compile();
    controller = unit;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
