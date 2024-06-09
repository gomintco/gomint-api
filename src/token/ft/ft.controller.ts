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
import { MintFtDto } from './dto/mint-ft.dto';
import { Request } from 'express';
import { TokenCreateDto } from '../dto/create-token.dto';

@Controller('ft')
@UseGuards(ApiKeyGuard) // might be better to use middleware for this
export class FtController {
  constructor(private readonly ftService: FtService) {}

  @Post('mint')
  async mint(@Req() req: Request, @Body() mintFtDto: MintFtDto) {
    // return { status: 'ok' };
    const user = req.user;
    try {
      const status = await this.ftService.tokenMintHandler(user, mintFtDto);
      return { status };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error minting token', {
        cause: err,
        description: err.message,
      });
    }
  }
}
