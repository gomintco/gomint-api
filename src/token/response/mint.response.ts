import { ApiProperty } from '@nestjs/swagger';

export class MintResponse {
  @ApiProperty()
  status: string;
  constructor(status: string) {
    this.status = status;
  }
}
