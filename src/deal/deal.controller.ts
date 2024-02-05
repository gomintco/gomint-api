import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { DealService } from './deal.service';
import { CreateDealDto } from './dto/create-deal.dto';
import { User } from 'src/user/user.entity';
import { GetBytesDto } from './dto/get-bytes.dt';

@Controller('deal')
export class DealController {
  constructor(private dealService: DealService) {}

  @UseGuards(ApiKeyGuard)
  @Post('create')
  async create(@Req() request, @Body() createDealDto: CreateDealDto) {
    const user = request.user as User;

    try {
      const dealId = await this.dealService.createDeal(user, createDealDto);
      return { dealId };
    } catch (err) {
      throw new ServiceUnavailableException('Error creating deal', {
        cause: err,
        description: err.message,
      });
    }
  }

  // get deal bytes -> GET when account does not have an encryption key
  @Get('bytes/:dealid')
  async getDealBytes(
    @Param('dealid') dealId: string,
    @Query('buyerId') buyerId: string,
    @Query('clientId') clientId: string,
  ) {
    if (!buyerId) throw new BadRequestException('buyerId is required');
    return this.dealService.getDealBytes(dealId, buyerId, clientId);
  }

  // get deal bytes -> POST when account has an encryption key
  // reequire API key guard? -> maybe good for tracking?
  @UseGuards(ApiKeyGuard)
  @Post('bytes/:dealid') // prob doesnt need dealid in the path
  async getDealBytesPost(@Body() getBytesDto: GetBytesDto) {
    const { dealId, buyerId, clientId, encryptionKey } = getBytesDto;
    return this.dealService.getDealBytes(
      dealId,
      buyerId,
      clientId,
      encryptionKey,
    );
  }
}
