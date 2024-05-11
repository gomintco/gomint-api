import { Module } from '@nestjs/common';
import { TokenService } from './token/token.service';
import { AccountService } from './account/account.service';
import { TransactionService } from './transaction/transaction.service';

@Module({
  providers: [TokenService, AccountService, TransactionService],
  exports: [TokenService, AccountService, TransactionService],
})
export class HederaModule {}
