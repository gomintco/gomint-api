import { Module } from '@nestjs/common';
import { ConsensusController } from './consensus.controller';
import { ConsensusService } from './consensus.service';

@Module({
  controllers: [ConsensusController],
  providers: [ConsensusService]
})
export class ConsensusModule {}
