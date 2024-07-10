import { Module } from '@nestjs/common';
import { ConsensusController } from './consensus.controller';
import { ConsensusMediator } from './consensus.mediator';

@Module({
  controllers: [ConsensusController],
  providers: [ConsensusMediator]
})
export class ConsensusModule {}
