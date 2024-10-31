import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { AccountMediator } from './account.mediator';
import { JwtOrApiKeyGuard, ApiKeyGuard } from '../auth/auth.guard';
import { createMock } from '@golevelup/ts-jest';
import { Logger } from '@nestjs/common';

describe('AccountController', () => {
  let controller: AccountController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        {
          provide: AccountService,
          useValue: createMock<AccountService>(),
        },
        {
          provide: AccountMediator,
          useValue: createMock<AccountMediator>(),
        },
        {
          provide: Logger,
          useValue: createMock<Logger>(),
        },
      ],
    })
      .overrideGuard(JwtOrApiKeyGuard)
      .useValue(createMock<JwtOrApiKeyGuard>())
      .overrideGuard(ApiKeyGuard)
      .useValue(createMock<ApiKeyGuard>())
      .compile();

    controller = module.get<AccountController>(AccountController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
