import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/auth/auth.guard';

@ApiTags('consensus')
@Controller('consensus')
@UseGuards(ApiKeyGuard)
export class ConsensusController {
  // post /consensus
  //
  // return {topicId}
  //
  @Post()
  createConsensus() {
    return { topicId: 'dummy topic id' };
  }
}
