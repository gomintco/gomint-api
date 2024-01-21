import { Module } from '@nestjs/common';
import { FtModule } from './ft/ft.module';

@Module({
  imports: [FtModule],
})
export class TokenModule {}
