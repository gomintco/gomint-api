import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyResponse } from '.';
import { ApiKey } from '../api-key.entity';

export class ApiKeysResponse {
  @ApiProperty({ type: ApiKeyResponse, isArray: true })
  apiKeys: ApiKeyResponse[];

  constructor(apiKeys: ApiKey[]) {
    this.apiKeys = apiKeys.map((apiKey) => new ApiKeyResponse(apiKey));
  }
}
