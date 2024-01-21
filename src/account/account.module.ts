import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { ClientModule } from 'src/client/client.module';
import { Account } from './account.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountController } from './account.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Account]), ClientModule],
  providers: [AccountService],
  exports: [AccountService],
  controllers: [AccountController],
})
export class AccountModule {}
