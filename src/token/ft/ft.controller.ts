import {
  Body,
  Controller,
  Post,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';

import { FtService } from './ft.service';
import { CreateFtDto } from './dto/create-ft.dto';
import { ApiKeyGuard } from '../../auth/auth.guard';
import { User } from 'src/user/user.entity';
import { MintFtDto } from './dto/mint-ft.dto';
import { TokenService } from 'src/hedera/token/token.service';
import { TransactionService } from 'src/hedera/transaction/transaction.service';
import { Client, PrivateKey, TokenType } from '@hashgraph/sdk';
import { AccountService } from 'src/account/account.service';
import { KeyService } from 'src/key/key.service';
import { KeyType } from 'src/app.interface';

@Controller('ft')
@UseGuards(ApiKeyGuard) // might be better to use middleware for this
export class FtController {
  constructor(
    private ftService: FtService,
    private tokenService: TokenService,
    private transactionService: TransactionService,
    private accountService: AccountService,
    private keyService: KeyService,
  ) {}

  @Post('create')
  async create(@Req() request, @Body() createFtDto: CreateFtDto) {
    const user = request.user as User;
    try {
      const token = await this.ftService.createTokenHandler(user, createFtDto);
      return { token };

      // const token = await this.ftService.createToken(user, createFtDto);
    } catch (err) {
      throw new ServiceUnavailableException('Error creating token', {
        cause: err,
        description: err.message,
      });
    }
  }

  @Post('mint')
  async mint(@Req() request, @Body() mintFtDto: MintFtDto) {
    // return { status: 'ok' };
    const user = request.user as User;
    try {
      const status = await this.ftService.mintToken(user, mintFtDto);
      return { status };
    } catch (err) {
      throw new ServiceUnavailableException('Error minting token', {
        cause: err,
        description: err.message,
      });
    }
  }
}
