import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateKeyDto } from './dto/create-key.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { User } from './user.entity';
import { UserResponse } from './response/user.response';
import { AccountResponse } from './response/account.response';
import { KeyResponse } from './response/key.response';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      // create user model
      const user = this.userService.create(createUserDto);
      // handle key/account creation if required
      // await this.userService.handleKeyOrAccountCreation(user, createUserDto);

      // encrypt escrow key if password is provided
      this.userService.encryptEscrowKey(user, createUserDto);
      const savedUser = await this.userService.save(user);
      const { username, id, network } = savedUser;
      return { username, id, network };
    } catch (err) {
      // if more errors may occur, handle them separately per their status code (exception type)
      console.error(err);
      throw new InternalServerErrorException('Error creating user', {
        cause: err,
        description: err.message,
      });
    }
  }

  @UseGuards(ApiKeyGuard)
  @Get()
  async getUser(@Req() request): Promise<UserResponse> {
    const { id: userId } = request.user as User;
    const user = await this.userService.getUser(userId);
    return new UserResponse(user);
  }

  @UseGuards(ApiKeyGuard)
  @Get('accounts')
  async getUserAccounts(
    @Req() request,
  ): Promise<{ id: string; accounts: AccountResponse[] }> {
    const { id: userId } = request.user as User;
    const { id, accounts } = await this.userService.getUserAccounts(userId);
    return {
      id,
      accounts: accounts.map((account) => new AccountResponse(account)),
    };
  }

  @UseGuards(ApiKeyGuard)
  @Get('keys')
  async getUserKeys(
    @Req() request,
  ): Promise<{ id: string; keys: KeyResponse[] }> {
    const { id: userId } = request.user as User;
    const { id, keys } = await this.userService.getUserKeys(userId);
    return { id, keys: keys.map((key) => new KeyResponse(key)) };
  }

  @UseGuards(ApiKeyGuard)
  @Post('create/key')
  async createKey(@Req() request, @Body() createKey: CreateKeyDto) {
    const user = request.user as User;
    try {
      const { type, publicKey } = await this.userService.createAndSaveKey(
        user,
        createKey,
      );
      return { type, publicKey };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Error creating key', {
        cause: err,
        description: err.message,
      });
    }
  }

  @UseGuards(ApiKeyGuard)
  @Post('create/account')
  async createAccount(
    @Req() request,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    const user = request.user as User;
    try {
      const account = await this.userService.createAndSaveAccount(
        user,
        createAccountDto,
      );
      const { id } = account;
      return { id };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Error creating account', {
        cause: err,
        description: err.message,
      });
    }
  }

  // @Get()
  // findAll() {
  //   return this.userService.findAll();
  // }
}
