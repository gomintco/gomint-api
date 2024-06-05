import { Module } from '@nestjs/common';
import { KeyService } from './key.service';

@Module({
  providers: [KeyService],
})
export class KeyModule {}
