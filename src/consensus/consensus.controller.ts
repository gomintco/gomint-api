import {
  Body,
  Controller,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyGuard } from 'src/auth/auth.guard';
import { ConsensusMediator } from './consensus.mediator';
import { TopicCreateResponse } from './response';
import type { Request } from 'express';
import { ENCRYPTION_KEY_HEADER } from 'src/core/headers.const';
import { TopicCreateDto } from './dtos';

@ApiTags('consensus')
@Controller('consensus')
@UseGuards(ApiKeyGuard)
export class ConsensusController {
  constructor(private readonly consensusMediator: ConsensusMediator) {}

  @Post('topic')
  @UseGuards(ApiKeyGuard)
  async createTopic(
    @Req() req: Request,
    @Body() dto: TopicCreateDto,
    @Headers(ENCRYPTION_KEY_HEADER) encryptionKey?: string,
  ): Promise<TopicCreateResponse> {
    const { user } = req;
    try {
      const topicId = await this.consensusMediator.createTopic(
        user,
        dto,
        encryptionKey,
      );
      return new TopicCreateResponse(topicId);
    } catch (error) {}
  }
}
