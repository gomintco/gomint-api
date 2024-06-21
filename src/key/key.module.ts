import { Module } from '@nestjs/common';
import { KeyService } from './key.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Key } from './key.entity';
import { KeyController } from './key.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Key])],
  providers: [KeyService],
  exports: [KeyService],
  controllers: [KeyController],
})
export class KeyModule {}
