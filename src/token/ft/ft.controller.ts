import {
  Body,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';

import { FtService } from './ft.service';
import { CreateFtDto } from './dto/create-ft.dto';
import { ApiKeyGuard } from '../../auth/auth.guard';
import { User } from 'src/user/user.entity';
import { MintFtDto } from './dto/mint-ft.dto';

@Controller('ft')
@UseGuards(ApiKeyGuard) // might be better to use middleware for this
export class FtController {
  constructor(private ftService: FtService) {}

  @Post('create')
  async create(@Req() request, @Body() createFtDto: CreateFtDto) {
    const user = request.user as User;
    try {
      const token = await this.ftService.createTokenHandler(user, createFtDto);
      return { token };
    } catch (err) {
      throw new ServiceUnavailableException('Error creating token', {
        cause: err,
        description: err.message,
      });
    }
  }

  @Post('mint')
  async mint(@Req() request, @Body() mintFtDto: MintFtDto) {
    // return { status: 'ok' };
    const user = request.user as User;
    try {
      const status = await this.ftService.mintTokenHandler(user, mintFtDto);
      return { status };
    } catch (err) {
      throw new ServiceUnavailableException('Error minting token', {
        cause: err,
        description: err.message,
      });
    }
  }
}
