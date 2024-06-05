import { Module } from '@nestjs/common';
import { HederaKeyService } from './key.service';

@Module({
  providers: [HederaKeyService]
})
export class KeyModule {}
