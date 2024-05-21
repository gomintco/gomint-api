import { Module } from '@nestjs/common';
import { FtService } from './ft.service';
import { FtController } from './ft.controller';
import { ClientModule } from '../../client/client.module';
import { UserModule } from 'src/user/user.module';
import { KeyModule } from 'src/key/key.module';
import { AuthModule } from 'src/auth/auth.module';
import { AccountModule } from 'src/account/account.module';
import { HederaModule } from 'src/hedera/hedera.module';

@Module({
  imports: [ClientModule, KeyModule, AuthModule, AccountModule, HederaModule],
  providers: [FtService],
  controllers: [FtController],
})
export class FtModule {}
