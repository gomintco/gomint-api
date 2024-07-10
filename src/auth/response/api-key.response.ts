import { maskString } from 'src/core/util/mask-string';
import { ApiKey } from '../api-key.entity';

export class ApiKeyResponse {
  id: number;
  value: string;
  /**
   * @todo implement `lastUsed` tracking
   */
  lastUsed: Date;
  createdAt: Date;

  constructor(entity: ApiKey) {
    this.id = entity.id;
    this.value = maskString(entity.key);
    this.lastUsed = undefined;
    this.createdAt = entity.createdAt;
  }
}
