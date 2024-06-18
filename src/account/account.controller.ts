import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { AssociateDto } from './dto/associate.dto';
import { AccountService } from './account.service';
import { Request } from 'express';
import { AccountCreateDto } from './dto/account-create.dto';
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

@Controller('account')
@UseGuards(ApiKeyGuard)
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private readonly accountService: AccountService) {}

  @Post()
  async create(
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

  @Post('association')
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
