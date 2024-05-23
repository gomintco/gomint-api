import { Module } from '@nestjs/common';
import { TokenService } from './token/token.service';
import { AccountService } from './account/account.service';
import { TransactionService } from './transaction/transaction.service';
import { MirrornodeService } from './mirrornode/mirrornode.service';

@Module({
  providers: [
    TokenService,
    AccountService,
    TransactionService,
    MirrornodeService,
  ],
  exports: [
    TokenService,
    AccountService,
    TransactionService,
    MirrornodeService,
  ],
  imports: [],
})
export class HederaModule {}
