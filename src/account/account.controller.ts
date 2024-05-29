import {
  Body,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { AssociateDto } from './dto/associate.dto';
import { AccountService } from './account.service';
import { Request } from 'express';

@Controller('account')
@UseGuards(ApiKeyGuard)
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Post('associate')
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
