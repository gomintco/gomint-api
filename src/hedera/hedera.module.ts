import { Module } from '@nestjs/common';
import { TokenService } from './token/token.service';
import { HederaAccountService } from './account/account.service';
import { TransactionService } from './transaction/transaction.service';
import { MirrornodeService } from './mirrornode/mirrornode.service';
import { KeyModule } from './key/key.module';
import { HederaKeyService } from './key/key.service';

@Module({
  providers: [
    TokenService,
    HederaAccountService,
    TransactionService,
    MirrornodeService,
    HederaKeyService
  ],
  exports: [
    TokenService,
    HederaAccountService,
    TransactionService,
    MirrornodeService,
    HederaKeyService
  ],
  imports: [KeyModule],
})
export class HederaModule {}
