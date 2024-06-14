import { Module } from '@nestjs/common';
import { FtModule } from './ft/ft.module';
import { NftModule } from './nft/nft.module';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { HederaModule } from 'src/hedera-api/hedera-api.module';
import { AccountModule } from 'src/account/account.module';
import { KeyModule } from 'src/key/key.module';
import { ClientModule } from 'src/client/client.module';
import { AuthModule } from 'src/auth/auth.module';
import { FtService } from './ft/ft.service';
import { NftService } from './nft/nft.service';

@Module({
  imports: [
    FtModule,
    NftModule,
    ClientModule,
    KeyModule,
    AuthModule,
    AccountModule,
    HederaModule,
  ],
  controllers: [TokenController],
  providers: [TokenService, FtService, NftService],
})
export class TokenModule {}
