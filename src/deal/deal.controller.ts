import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpException,
  InternalServerErrorException,
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
import { GetBytesDto } from './dto/get-bytes.dto';
import { Request } from 'express';
import { DealNotFoundError } from './error/deal-not-found.error';
import { EncryptionKeyNotProvidedError } from './error/encryption-key-not-provided.error';
import { NotNftOwnerError } from './error/not-nft-owner.error';
import { InvalidKeyType } from './error/invalid-key-type.error';
import { ENCRYPTION_KEY_HEADER } from 'src/core/encryption-key-header.const';

@Controller('deal')
export class DealController {
  private readonly logger = new Logger(DealController.name);

  constructor(private readonly dealService: DealService) { }

  @UseGuards(ApiKeyGuard)
  @Post()
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

  @UseGuards(ApiKeyGuard)
  @Get('bytes/:dealId')
  async getDealBytes(
    @Param('dealId') dealId: string,
    @Query() { receiverId, network, payerId, serial }: GetBytesDto,
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey: string,
  ) {
    try {
      return await this.dealService.getDealBytes(
        network,
        dealId,
        receiverId,
        payerId,
        serial,
        encryptionKey,
      );
    } catch (error) {
      this.logger.error(error);
      switch (true) {
        case error instanceof HttpException:
          throw error;
        case error instanceof DealNotFoundError:
        case error instanceof EncryptionKeyNotProvidedError:
        case error instanceof NotNftOwnerError:
        case error instanceof EncryptionKeyNotProvidedError:
        case error instanceof InvalidKeyType:
          throw new BadRequestException();
        default:
          throw new InternalServerErrorException();
      }
    }
  }
}
