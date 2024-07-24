import { ApiProperty } from '@nestjs/swagger';

export class TokenAssociateResponse {
  @ApiProperty()
  status: string;

  constructor(status: string) {
    this.status = status;
  }
}
