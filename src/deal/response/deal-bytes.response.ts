import { ApiProperty } from '@nestjs/swagger';

export class DealBytesResponse {
  @ApiProperty({ type: Uint8Array, example: Uint8Array.from([1, 2]) })
  bytes: Uint8Array;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }
}
