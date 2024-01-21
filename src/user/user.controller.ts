import {
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { KeyService } from '../key/key.service';

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
      return savedUser;
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Error creating user', {
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
