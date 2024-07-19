import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard, JwtOrApiKeyGuard } from 'src/auth/auth.guard';
import { AssociateDto, AccountCreateDto, AccountUpdateDto } from './dto';
import { AccountService } from './account.service';
import { Request } from 'express';
import { ENCRYPTION_KEY_HEADER } from 'src/core/headers.const';
import {
  AccountAliasAlreadyExistsError,
  EncryptionKeyNotProvidedError,
  DecryptionFailedError,
  InvalidNetworkError,
  AccountNotFoundError,
  InvalidKeyTypeError,
} from 'src/core/error';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';
import { AccountMediator } from './account.mediator';
import { AccountUpdateResponse } from './response';
import { ApiTags } from '@nestjs/swagger';
import { AccountResponse } from './response';

@ApiTags('account')
@Controller('account')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(
    private readonly accountService: AccountService,
    private readonly accountMediator: AccountMediator,
  ) {}

  @Get()
  @UseGuards(JwtOrApiKeyGuard)
  async getUserAccounts(
    @Req() req: Request,
  ): Promise<{ id: string; accounts: AccountResponse[] }> {
    const userId = req.user?.id ?? req.payload?.sub;

    const accounts = await this.accountMediator.findUserAccounts(userId);
    const responseAccount = accounts.map(
      (account) => new AccountResponse(account),
    );

    return {
      id: userId,
      accounts: responseAccount,
    };
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  async createAccount(
    @Req() req: Request,
    @Body() accountCreateDto: AccountCreateDto,
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey?: string,
  ) {
    const { user } = req;
    try {
      const accountId = await this.accountService.createAccount(
        user,
        accountCreateDto,
        encryptionKey,
      );
      return { accountId };
    } catch (error: any) {
      handleEndpointErrors(
        this.logger,
        error,
        [
          {
            errorTypes: [
              AccountAliasAlreadyExistsError,
              EncryptionKeyNotProvidedError,
              InvalidNetworkError,
              DecryptionFailedError,
            ],
            toThrow: BadRequestException,
          },
        ],
        ServiceUnavailableException,
      );
    }
  }

  @Patch(':accountId')
  @UseGuards(JwtOrApiKeyGuard)
  async updateAccount(
    @Body() dto: AccountUpdateDto,
    @Param('accountId') accountId: string,
    @Req() req: Request,
  ): Promise<AccountUpdateResponse> {
    try {
      const userId = req.user?.id ?? req.payload?.sub;
      const oldAccount = await this.accountMediator.update(userId, accountId, {
        alias: dto.alias,
      });

      return new AccountUpdateResponse(oldAccount, dto);
    } catch (error) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [AccountNotFoundError], toThrow: NotFoundException },
      ]);
    }
  }

  @Post('association')
  @UseGuards(ApiKeyGuard)
  async associate(
    @Req() req: Request,
    @Body() associateDto: AssociateDto,
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey?: string,
  ) {
    const { user } = req;

    try {
      const status = await this.accountService.associate(
        user,
        associateDto,
        encryptionKey,
      );
      return { status };
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        {
          errorTypes: [
            EncryptionKeyNotProvidedError,
            DecryptionFailedError,
            InvalidKeyTypeError,
            InvalidNetworkError,
          ],
          toThrow: BadRequestException,
        },
        {
          errorTypes: [InvalidKeyTypeError, InvalidNetworkError],
          toThrow: InternalServerErrorException,
        },
        { errorTypes: [AccountNotFoundError], toThrow: NotFoundException },
      ]);
    }
  }
}
