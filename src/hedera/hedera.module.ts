import { Module } from '@nestjs/common';
import { TokenService } from './token/token.service';
import { AccountService } from './account/account.service';
import { TransactionService } from './transaction/transaction.service';
import { KeyModule } from './key/key.module';
import { MirrornodeModule } from './mirrornode/mirrornode.module';

@Module({
  providers: [TokenService, AccountService, TransactionService],
  exports: [TokenService, AccountService, TransactionService, MirrornodeModule],
  imports: [KeyModule, MirrornodeModule],
})
export class HederaModule {}
