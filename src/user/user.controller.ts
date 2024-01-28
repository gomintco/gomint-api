import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
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

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('create')
  async create(@Body() createUserDto: CreateUserDto) {
    console.log('createUserDto', createUserDto);
    try {
      // create user model
      const user = this.userService.create(createUserDto);
      // handle key/account creation if required
      await this.userService.handleKeyOrAccountCreation(user, createUserDto);
      // encrypt escrow key if password is provided
      this.userService.encryptEscrowKey(user, createUserDto);
      const savedUser = await this.userService.save(user);
      const { username, id, network } = savedUser;
      return { username, id, network };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Error creating user', {
        cause: err,
        description: err.message,
      });
    }
  }

  @UseGuards(ApiKeyGuard)
  @Get()
  getUser(@Req() request) {
    const user = request.user as User;
    return this.userService.getUser(user.id);
  }

  @UseGuards(ApiKeyGuard)
  @Get('accounts')
  getUserAccounts(@Req() request) {
    const user = request.user as User;
    return this.userService.getUserAccounts(user.id);
  }

  @UseGuards(ApiKeyGuard)
  @Get('keys')
  getUserKeys(@Req() request) {
    const user = request.user as User;
    return this.userService.getUserKeys(user.id);
  }

  @UseGuards(ApiKeyGuard)
  @Post('create/key')
  async createKey(@Req() request, @Body() createKey: CreateKeyDto) {
    const user = request.user as User;
    try {
      const key = await this.userService.createAndSaveKey(user, createKey);
      return key;
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
      const { id, ...rest } = account;
      return { id };
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Error creating account', {
        cause: err,
        description: err.message,
      });
    }
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }
}
