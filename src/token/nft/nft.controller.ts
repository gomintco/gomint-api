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
import { NftService } from './nft.service';
import { CreateNftDto } from './dto/create-nft.dto';
import { MintNftDto } from './dto/mint-nft.dto';
import { Request } from 'express';

@Controller('nft')
@UseGuards(ApiKeyGuard)
export class NftController {
  constructor(private readonly nftService: NftService) {}

  // Should be able to mint as well
  @Post('create')
  async create(@Req() req: Request, @Body() createNftDto: CreateNftDto) {
    const user = req.user;

    try {
      const token = await this.nftService.createToken(user, createNftDto);
      return { token };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error creating token', {
        cause: err,
        description: err.message,
      });
    }
  }

  @Post('mint')
  async mint(@Req() req: Request, @Body() mintNftDto: MintNftDto) {
    if (
      !mintNftDto.metadata &&
      !mintNftDto.amount &&
      !mintNftDto.metadatas.length
    ) {
      throw new BadRequestException('Metadata is required');
    }
    if (
      !mintNftDto.metadatas.length &&
      (!mintNftDto.metadata || !mintNftDto.amount)
    ) {
      throw new BadRequestException(
        'Both amount and metadata must be provided if metadatas array is empty',
      );
    }
    const user = req.user;
    try {
      const status = await this.nftService.mintToken(user, mintNftDto);
      return { status };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error minting token', {
        cause: err,
        description: err.message,
      });
    }
  }
}
