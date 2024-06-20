import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { UserResponse } from './response/user.response';
import { AccountResponse } from './response/account.response';
import { KeyResponse } from './response/key.response';
import { Request } from 'express';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(ApiKeyGuard)
  @Get('account')
  async getUserAccounts(
    @Req() req: Request,
  ): Promise<{ id: string; accounts: AccountResponse[] }> {
    const { id: userId } = req.user;
    const { id, accounts } = await this.userService.getUserAccounts(userId);
    return {
      id,
      accounts: accounts.map((account) => new AccountResponse(account)),
    };
  }

  @UseGuards(ApiKeyGuard)
  @Get('key')
  async getUserKeys(
    @Req() req: Request,
  ): Promise<{ id: string; keys: KeyResponse[] }> {
    const { id: userId } = req.user;
    const { id, keys } = await this.userService.getUserKeys(userId);
    return { id, keys: keys.map((key) => new KeyResponse(key)) };
  }
}
