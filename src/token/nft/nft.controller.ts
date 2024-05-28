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
import { User } from 'src/user/user.entity';
import { MintNftDto } from './dto/mint-nft.dto';

@Controller('nft')
@UseGuards(ApiKeyGuard)
export class NftController {
  constructor(private nftService: NftService) {}

  // Should be able to mint as well
  @Post('create')
  async create(@Req() request, @Body() createNftDto: CreateNftDto) {
    const user = request.user as User;

    try {
      const token = await this.nftService.createTokenHandler(
        user,
        createNftDto,
      );
      return { token };
    } catch (err) {
      throw new ServiceUnavailableException('Error creating token', {
        cause: err,
        description: err.message,
      });
    }
  }

  @Post('mint')
  async mint(@Req() request, @Body() mintNftDto: MintNftDto) {
    // error handling which (Jake thinks) cannot be done using class-validator
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
    const user = request.user as User;
    try {
      const status = await this.nftService.mintTokenHandler(user, mintNftDto);
      return { status };
    } catch (err) {
      throw new ServiceUnavailableException('Error minting token', {
        cause: err,
        description: err.message,
      });
    }
  }
}
