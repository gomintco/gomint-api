import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  UseGuards,
  Req,
  Logger,
  Headers,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { UserResponse } from './response/user.response';
import { AccountResponse } from './response/account.response';
import { KeyResponse } from './response/key.response';
import { Request } from 'express';

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
  ) {
    try {
      // create user model
      const { username, id, network } = await this.userService.create(
        createUserDto,
      );

      return { username, id, network };
    } catch (err: any) {
      this.logger.error(err);
      throw new InternalServerErrorException('Error creating user', {
        cause: err,
        description: err.message,
      });
    }
  }

  @UseGuards(ApiKeyGuard)
  @Get()
  async getUser(@Req() req: Request): Promise<UserResponse> {
    const { id: userId } = req.user;
    const user = await this.userService.getUser(userId);
    return new UserResponse(user);
  }

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



  // @Get()
  // findAll() {
  //   return this.userService.findAll();
  // }
}
