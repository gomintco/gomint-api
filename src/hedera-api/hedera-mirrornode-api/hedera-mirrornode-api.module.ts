import { Module } from '@nestjs/common';
import { HederaMirrornodeApiService } from './hedera-mirrornode-api.service';

@Module({
  providers: [HederaMirrornodeApiService],
})
export class MirrornodeModule {}
