import { Module } from '@nestjs/common';
import { NftService } from './nft.service';
import { ClientModule } from 'src/client/client.module';
import { KeyModule } from 'src/key/key.module';
import { AuthModule } from 'src/auth/auth.module';
import { AccountModule } from 'src/account/account.module';
import { HederaModule } from 'src/hedera-api/hedera-api.module';


@Module({
  imports: [ClientModule, KeyModule, AuthModule, AccountModule, HederaModule],
  providers: [NftService],
  controllers: [],
})
export class NftModule {}
