import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { CreateTopicResponse } from './response';

@ApiTags('consensus')
@Controller('consensus')
@UseGuards(ApiKeyGuard)
export class ConsensusController {
  @Post()
  async createConsensus(): Promise<CreateTopicResponse> {
    return new CreateTopicResponse('dummy topic id');
  }
}
