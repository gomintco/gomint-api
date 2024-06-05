import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { NftController } from './nft.controller';
import { ClientModule } from 'src/client/client.module';
import { KeyModule } from 'src/key/key.module';
import { AuthModule } from 'src/auth/auth.module';
import { AccountModule } from 'src/account/account.module';
import { HederaModule } from 'src/hedera/hedera.module';

@Module({
  imports: [ClientModule, KeyModule, AuthModule, AccountModule, HederaModule],
  providers: [NftService],
  controllers: [NftController],
})
export class NftModule {}
