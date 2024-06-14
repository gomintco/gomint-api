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
import { GetBytesDto } from './dto/get-bytes.dto';
import { Network } from 'src/hedera-api/network.enum';
import { Request } from 'express';

@Controller('deal')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @UseGuards(ApiKeyGuard)
  @Post('')
  async create(@Req() req: Request, @Body() createDealDto: CreateDealDto) {
    const user = req.user;

    try {
      const dealId = await this.dealService.createDeal(user, createDealDto);
      return { dealId };
    } catch (err: any) {
      throw new ServiceUnavailableException('Error creating deal', {
        cause: err,
        description: err.message,
      });
    }
  }

  // get deal bytes -> GET when account does not have an encryption key
  @Get('bytes/:dealId')
  async getDealBytes(
    @Param('dealId') dealId: string,
    @Query('network') network: Network,
    @Query('receiverId') receiverId: string,
    @Query('payerId') payerId: string | undefined,
    @Query('serial') serial: string | undefined,
  ) {
    if (!receiverId) throw new BadRequestException('receiverId is required');
    if (!network) throw new BadRequestException('network is required');
    return this.dealService.getDealBytes(
      network,
      dealId,
      receiverId,
      payerId,
      Number(serial),
    );
  }

  // get deal bytes -> POST when account has an encryption key
  // require API key guard? -> maybe good for tracking?
  // IF USING API KEY GUARD... ENSURE IT MATCHES WITH THE DEAL CREATOR
  @UseGuards(ApiKeyGuard)
  @Post('bytes')
  @HttpCode(200)
  async getDealBytesPost(@Body() getBytesDto: GetBytesDto) {
    const { network, dealId, receiverId, payerId, encryptionKey, serial } =
      getBytesDto;
    return this.dealService.getDealBytes(
      network,
      dealId,
      receiverId,
      payerId,
      serial,
      encryptionKey,
    );
  }
}
