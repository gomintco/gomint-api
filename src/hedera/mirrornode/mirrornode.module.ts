import { Module } from '@nestjs/common';
import { MirrornodeService } from './mirrornode.service';

@Module({
  providers: [MirrornodeService],
})
export class MirrornodeModule {}
