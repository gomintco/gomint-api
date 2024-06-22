import { Module } from '@nestjs/common';
import { FtService } from './ft.service';
import { ClientModule } from '../../client/client.module';
import { KeyModule } from 'src/key/key.module';
import { AccountModule } from 'src/account/account.module';
import { HederaModule } from 'src/hedera-api/hedera-api.module';

@Module({
  imports: [ClientModule, KeyModule, AccountModule, HederaModule],
  providers: [FtService],
  controllers: [],
})
export class FtModule {}
