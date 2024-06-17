import {
  Body,
  Controller,
  Headers,
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

@Controller('account')
@UseGuards(ApiKeyGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() accountCreateDto: AccountCreateDto,
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey?: string,
  ) {
    const user = req.user;

    try {
      const accountId = await this.accountService.accountCreateHandler(
        user,
        accountCreateDto,
        encryptionKey,
      );
      return { accountId };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error creating account', {
        cause: err,
        description: err.message,
      });
    }
  }

  @Post('association')
  async associate(@Req() req: Request, @Body() associateDto: AssociateDto) {
    const user = req.user;

    try {
      const status = await this.accountService.associate(user, associateDto);
      return { status };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error associating account', {
        cause: err,
        description: err.message,
      });
    }
  }
}
