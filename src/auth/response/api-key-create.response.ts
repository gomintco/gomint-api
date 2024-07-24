import { ApiProperty } from '@nestjs/swagger';

export class ApiKeyCreateResponse {
  @ApiProperty()
  apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
}
