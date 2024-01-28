import { Module } from '@nestjs/common';
import { FtModule } from './ft/ft.module';
import { NftModule } from './nft/nft.module';

@Module({
  imports: [FtModule, NftModule],
})
export class TokenModule {}
