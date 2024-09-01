import { Module } from '@nestjs/common';
import { ConsensusController } from './consensus.controller';
import { ConsensusMediator } from './consensus.mediator';
import { HederaModule } from 'src/hedera-api/hedera-api.module';
import { ClientModule } from 'src/client/client.module';
import { KeyModule } from 'src/key/key.module';
import { AccountModule } from 'src/account/account.module';

@Module({
  imports: [HederaModule, ClientModule, KeyModule, AccountModule],
  controllers: [ConsensusController],
  providers: [ConsensusMediator],
})
export class ConsensusModule {}
