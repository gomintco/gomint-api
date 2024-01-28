import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { ClientModule } from 'src/client/client.module';
import { Account } from './account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), ClientModule],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
