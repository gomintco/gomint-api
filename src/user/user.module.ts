import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './user.entity';
import { KeyModule } from 'src/key/key.module';
import { AccountModule } from 'src/account/account.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), KeyModule, AccountModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
