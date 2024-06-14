import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { TokenService } from './token.service';
import { TokenCreateDto } from './dto/token-create.dto';
import { Request } from 'express';
import { FtService } from './ft/ft.service';
import { NftService } from './nft/nft.service';
import { TokenMintDto } from './dto/token-mint.dto';
import { TokenAssociateDto } from './dto/token-associate.dto';

@Controller('token')
@UseGuards(ApiKeyGuard)
export class TokenController {
  constructor(
    private readonly ftService: FtService,
    private readonly nftService: NftService,
    private readonly tokenService: TokenService,
  ) {}

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

  @Post('mint')
  async mint(@Req() req: Request, @Body() tokenMintDto: TokenMintDto) {
    const user = req.user;

    try {
      let status: string;
      if (tokenMintDto.tokenType === 'ft') {
        if (!tokenMintDto.amount)
          throw new BadRequestException('For ft mints you must include amount');
        status = await this.ftService.tokenMintHandler(user, tokenMintDto);
      } else {
        if (
          !tokenMintDto.metadata &&
          !tokenMintDto.amount &&
          !tokenMintDto.metadatas.length
        ) {
          throw new BadRequestException('Metadata is required');
        }
        if (
          !tokenMintDto.metadatas.length &&
          (!tokenMintDto.metadata || !tokenMintDto.amount)
        ) {
          throw new BadRequestException(
            'Both amount and metadata must be provided if metadatas array is empty',
          );
        }
        status = await this.nftService.tokenMintHandler(user, tokenMintDto);
      }
      return { status };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error creating token', {
        cause: err,
        description: err.message,
      });
    }
  }

  @Post('association')
  async associate(
    @Req() req: Request,
    @Body() tokenAssociateDto: TokenAssociateDto,
  ) {
    const user = req.user;

    try {
      const status = await this.tokenService.tokenAssociateHandler(
        user,
        tokenAssociateDto,
      );
      return { status };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error associating account', {
        cause: err,
        description: err.message,
      });
    }
  }
}
