import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Logger,
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
import { AccountAliasAlreadyExists } from './error/account-alias-already-exists.error';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';
import { EncryptionKeyNotProvidedError } from 'src/deal/error/encryption-key-not-provided.error';
import { DecryptionFailedError } from 'src/key/error/decryption-failed.error';
import { InvalidNetworkError } from 'src/deal/error/invalid-network.error';

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
              AccountAliasAlreadyExists,
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
    } catch (err: any) {
      throw new ServiceUnavailableException('Error associating account', {
        cause: err,
        description: err.message,
      });
    }
  }
}
