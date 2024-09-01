import { Test, TestingModule } from '@nestjs/testing';
import { ConsensusController } from './consensus.controller';

describe('ConsensusController', () => {
  let controller: ConsensusController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsensusController],
    }).compile();

    controller = module.get<ConsensusController>(ConsensusController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
