import { ApiProperty } from '@nestjs/swagger';

export class TopicCreateResponse {
  @ApiProperty()
  topicId: string;

  constructor(topicId: string) {
    this.topicId = topicId;
  }
}
