import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Logger,
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
import { GetBytesDto } from './dto/get-bytes.query';
import { Request } from 'express';
import {
  DealNotFoundError,
  DecryptionFailedError,
  EncryptionKeyNotProvidedError,
  InvalidKeyTypeError,
  NotNftOwnerError,
} from 'src/core/error';
import { ENCRYPTION_KEY_HEADER } from 'src/core/headers.const';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';
import { ApiTags } from '@nestjs/swagger';
import { DealBytesResponse, DealCreateResponse } from './response';

@ApiTags('deal')
@Controller('deal')
export class DealController {
  private readonly logger = new Logger(DealController.name);

  constructor(private readonly dealService: DealService) {}

  @UseGuards(ApiKeyGuard)
  @Post()
  async create(
    @Req() req: Request,
    @Body() createDealDto: CreateDealDto,
  ): Promise<DealCreateResponse> {
    const { user } = req;

    try {
      const dealId = await this.dealService.createDeal(user, createDealDto);

      return new DealCreateResponse(dealId);
    } catch (err: any) {
      throw new ServiceUnavailableException('Error creating deal', {
        cause: err,
        description: err.message,
      });
    }
  }

  @UseGuards(ApiKeyGuard)
  @Get('bytes/:dealId')
  async getDealBytes(
    @Param('dealId') dealId: string,
    @Query() { receiverId, network, payerId, serial }: GetBytesDto,
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey?: string,
  ): Promise<DealBytesResponse> {
    try {
      const bytes = await this.dealService.getDealBytes(
        network,
        dealId,
        receiverId,
        payerId,
        serial,
        encryptionKey,
      );

      return new DealBytesResponse(bytes);
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        {
          errorTypes: [
            DealNotFoundError,
            NotNftOwnerError,
            EncryptionKeyNotProvidedError,
            DecryptionFailedError,
            InvalidKeyTypeError,
          ],
          toThrow: BadRequestException,
        },
      ]);
    }
  }
}
