import { Test, TestingModule } from '@nestjs/testing';
import { FtController } from './ft.controller';

describe('FtController', () => {
  let controller: FtController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FtController],
    }).compile();

    controller = module.get<FtController>(FtController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
