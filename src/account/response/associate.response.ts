import { ApiProperty } from '@nestjs/swagger';

export class AssociateResponse {
  @ApiProperty()
  status: string;

  constructor(status: string) {
    this.status = status;
  }
}
