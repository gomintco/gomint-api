import {
  Body,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { TokenService } from './token.service';
import { TokenCreateDto } from './dto/create-token.dto';
import { Request } from 'express';
import { FtService } from './ft/ft.service';
import { NftService } from './nft/nft.service';

@Controller('token')
@UseGuards(ApiKeyGuard)
export class TokenController {
  constructor(
    private readonly ftService: FtService,
    private readonly nftService: NftService,
  ) { }

  @Post('')
  async create(@Req() req: Request, @Body() tokenCreateDto: TokenCreateDto) {
    const user = req.user;

    try {
      const token =
        tokenCreateDto.tokenType === 'ft'
          ? await this.ftService.tokenCreateHandler(user, tokenCreateDto)
          : await this.nftService.tokenCreateHandler(user, tokenCreateDto);

      return { token };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error creating token', {
        cause: err,
        description: err.message,
      });
    }
  }
}
