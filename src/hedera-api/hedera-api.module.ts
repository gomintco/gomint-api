import { Module } from '@nestjs/common';
import { HederaTokenApiService } from './hedera-token-api/hedera-token-api.service';
import { HederaAccountApiService } from './hedera-account-api/hedera-account-api.service';
import { HederaTransactionApiService } from './hedera-transaction-api/hedera-transaction-api.service';
import { HederaMirrornodeApiService } from './hedera-mirrornode-api/hedera-mirrornode-api.service';
import { KeyModule } from 'src/key/key.module';
import { HederaKeyApiService } from './hedera-key-api/hedera-key-api.service';
import { IpfsModule } from 'src/ipfs/ipfs.module';
import { HederaConsensusApiService } from './hedera-consensus-api/hedera-consensus-api.service';

@Module({
  providers: [
    HederaTokenApiService,
    HederaAccountApiService,
    HederaTransactionApiService,
    HederaMirrornodeApiService,
    HederaKeyApiService,
    HederaConsensusApiService,
  ],
  exports: [
    HederaTokenApiService,
    HederaAccountApiService,
    HederaTransactionApiService,
    HederaMirrornodeApiService,
    HederaKeyApiService,
    HederaConsensusApiService,
  ],
  imports: [KeyModule, IpfsModule],
})
export class HederaModule {}
