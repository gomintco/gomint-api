import { ApiProperty } from '@nestjs/swagger';

export class DealCreateResponse {
  @ApiProperty()
  dealId: string;

  constructor(dealId: string) {
    this.dealId = dealId;
  }
}
