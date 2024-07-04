import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  InternalServerErrorException,
  Logger,
  NotFoundException,
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
import { ENCRYPTION_KEY_HEADER } from 'src/core/headers.const';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';
import {
  AccountNotFoundError,
  DecryptionFailedError,
  EncryptionKeyNotProvidedError,
  InvalidHederaIdError,
  InvalidNetworkError,
} from 'src/core/error';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('token')
@Controller('token')
@UseGuards(ApiKeyGuard)
export class TokenController {
  private readonly logger = new Logger(TokenController.name);

  constructor(
    private readonly ftService: FtService,
    private readonly nftService: NftService,
    private readonly tokenService: TokenService,
  ) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() tokenCreateDto: TokenCreateDto,
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey?: string,
  ) {
    const { user } = req;

    try {
      const token =
        tokenCreateDto.tokenType === 'ft'
          ? await this.ftService.tokenCreateHandler(
              user,
              tokenCreateDto,
              encryptionKey,
            )
          : await this.nftService.tokenCreateHandler(
              user,
              tokenCreateDto,
              encryptionKey,
            );

      return { token };
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        {
          errorTypes: [
            DecryptionFailedError,
            EncryptionKeyNotProvidedError,
            InvalidHederaIdError,
          ],
          toThrow: BadRequestException,
        },
        { errorTypes: [AccountNotFoundError], toThrow: NotFoundException },
        {
          errorTypes: [InvalidNetworkError],
          toThrow: InternalServerErrorException,
        },
      ]);
    }
  }

  @Post('mint')
  async mint(
    @Req() req: Request,
    @Body() tokenMintDto: TokenMintDto,
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey?: string,
  ) {
    const { user } = req;

    try {
      let status: string;
      if (tokenMintDto.tokenType === 'ft') {
        if (!tokenMintDto.amount) {
          throw new BadRequestException('For ft mints you must include amount');
        }
        status = await this.ftService.tokenMintHandler(
          user,
          tokenMintDto,
          encryptionKey,
        );
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
        status = await this.nftService.tokenMintHandler(
          user,
          tokenMintDto,
          encryptionKey,
        );
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
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey?: string,
  ) {
    const { user } = req;

    try {
      const status = await this.tokenService.tokenAssociateHandler(
        user,
        tokenAssociateDto,
        encryptionKey,
      );
      return { status };
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [AccountNotFoundError], toThrow: NotFoundException },
      ]);
    }
  }
}
