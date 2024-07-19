import { ApiProperty } from '@nestjs/swagger';

export class TokenCreateResponse {
  @ApiProperty()
  token: string;

  constructor(token: string) {
    this.token = token;
  }
}
