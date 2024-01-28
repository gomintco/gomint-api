import {
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

@Controller('nft')
@UseGuards(ApiKeyGuard)
export class NftController {
  constructor(private nftService: NftService) {}

  @Post('create')
  async create(@Req() request, @Body() createNftDto: CreateNftDto) {
    const user = request.user as User;

    try {
      const token = await this.nftService.createToken(user, createNftDto);
      return { token };
    } catch (err) {
      throw new ServiceUnavailableException('Error creating token', {
        cause: err,
        description: err.message,
      });
    }
  }
}
