import { Module } from '@nestjs/common';
import { HederaKeyApiService } from './hedera-key-api.service';

@Module({
  providers: [HederaKeyApiService]
})
export class KeyModule {}
