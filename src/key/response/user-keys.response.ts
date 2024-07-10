import { KeyResponse } from 'src/user/response';
import { Key } from '../key.entity';
import { ApiProperty } from '@nestjs/swagger';

export class UserKeysResponse {
  @ApiProperty({ type: KeyResponse, isArray: true })
  keys: KeyResponse[];

  @ApiProperty()
  id: string;

  constructor(userId: string, keys: Key[]) {
    this.id = userId;
    this.keys = keys.map((key) => new KeyResponse(key));
  }
}
