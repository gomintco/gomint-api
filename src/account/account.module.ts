import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { ClientModule } from 'src/client/client.module';
import { Account } from './account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';
import { KeyModule } from 'src/key/key.module';
import { HederaModule } from 'src/hedera-api/hedera-api.module';
import { AccountMediator } from './account.mediator';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account]),
    ClientModule,
    KeyModule,
    HederaModule,
  ],
  providers: [AccountService, AccountMediator],
  exports: [AccountService],
  controllers: [AccountController],
})
export class AccountModule {}
