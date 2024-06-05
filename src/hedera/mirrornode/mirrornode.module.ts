import { Module } from '@nestjs/common';
import { MirrornodeService } from './mirrornode.service';

@Module({
  providers: [MirrornodeService],
  exports: [MirrornodeService],
})
export class MirrornodeModule {}
