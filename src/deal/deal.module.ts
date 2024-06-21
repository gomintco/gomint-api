import { Module } from '@nestjs/common';
import { DealService } from './deal.service';
import { DealController } from './deal.controller';
import { AccountModule } from 'src/account/account.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Deal } from './deal.entity';
import { KeyModule } from 'src/key/key.module';

@Module({
  imports: [TypeOrmModule.forFeature([Deal]), AccountModule, KeyModule],
  providers: [DealService],
  controllers: [DealController],
})
export class DealModule {}
