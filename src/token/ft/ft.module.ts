import { Module } from '@nestjs/common';
import { FtService } from './ft.service';
import { FtController } from './ft.controller';
import { ClientModule } from '../../client/client.module';
import { UserModule } from 'src/user/user.module';
import { KeyModule } from 'src/key/key.module';
import { AccountModule } from 'src/account/account.module';

@Module({
  imports: [ClientModule, UserModule, KeyModule, AccountModule],
  providers: [FtService],
  controllers: [FtController],
})
export class FtModule {}
