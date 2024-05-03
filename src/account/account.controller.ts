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
import { User } from 'src/user/user.entity';

@Controller('account')
@UseGuards(ApiKeyGuard)
export class AccountController {
  constructor(private accountService: AccountService) {}

  @Post('associate')
  async associate(@Req() request, @Body() associateDto: AssociateDto) {
    const user = request.user as User;

    try {
      const status = await this.accountService.associate(user, associateDto);
      return { status };
    } catch (err) {
      throw new ServiceUnavailableException('Error associating account', {
        cause: err,
        description: err.message,
      });
    }
  }
}
