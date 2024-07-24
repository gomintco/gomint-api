import { ApiProperty } from '@nestjs/swagger';
import { JwtPayload } from 'jsonwebtoken';

export class ProfileResponse {
  @ApiProperty()
  username: string;
  @ApiProperty()
  sub: string;
  @ApiProperty()
  iat: number;
  @ApiProperty()
  exp: number;

  constructor(payload: JwtPayload) {
    this.username = payload.username;
    this.sub = payload.sub;
    this.iat = payload.iat;
    this.exp = payload.exp;
  }
}
