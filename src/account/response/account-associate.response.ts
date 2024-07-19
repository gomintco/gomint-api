import { ApiProperty } from '@nestjs/swagger';

export class AccountAssociateResponse {
  @ApiProperty()
  status: string;

  constructor(status: string) {
    this.status = status;
  }
}
