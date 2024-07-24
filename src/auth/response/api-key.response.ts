import { maskString } from 'src/core/util/mask-string';
import { ApiKey } from '../api-key.entity';
import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyResponse {
  @ApiProperty()
  id: number;

  @ApiProperty()
  value: string;

  /**
   * @todo implement `lastUsed` tracking
   */
  @ApiProperty()
  lastUsed: Date;

  @ApiProperty()
  createdAt: Date;

  constructor(entity: ApiKey) {
    this.id = entity.id;
    this.value = maskString(entity.key);
    this.lastUsed = undefined;
    this.createdAt = entity.createdAt;
  }
}
