import { ApiProperty } from '@nestjs/swagger';
import { KeyType } from 'src/key/key-type.enum';
import { Key } from 'src/key/key.entity';

export class KeyResponse {
  @ApiProperty({ enum: KeyType, enumName: 'KeyType' })
  type: KeyType;

  @ApiProperty()
  publicKey: string;

  constructor({ type, publicKey }: Key) {
    this.type = type;
    this.publicKey = publicKey;
  }
}
