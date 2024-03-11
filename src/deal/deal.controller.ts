import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
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
import { Network } from 'src/app.interface';

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
    @Query('network') network: Network,
    @Query('buyerId') buyerId: string,
    @Query('clientId') clientId: string | undefined,
    @Query('serial') serial: string | undefined,
  ) {
    if (!buyerId) throw new BadRequestException('buyerId is required');
    if (!network) throw new BadRequestException('network is required');
    return this.dealService.getDealBytes(
      network,
      dealId,
      buyerId,
      clientId,
      serial,
    );
  }

  // get deal bytes -> POST when account has an encryption key
  @UseGuards(ApiKeyGuard)
  @Post('bytes')
  @HttpCode(200)
  async getDealBytesPost(@Body() getBytesDto: GetBytesDto) {
    const { network, dealId, buyerId, clientId, encryptionKey, serial } =
      getBytesDto;
    return this.dealService.getDealBytes(
      network,
      dealId,
      buyerId,
      clientId,
      encryptionKey,
      serial,
    );
  }
}
