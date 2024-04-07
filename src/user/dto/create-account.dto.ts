import { IsEnum, IsNotIn, IsOptional, IsString } from 'class-validator';
import { KeyType } from '../../app.interface';

export class CreateAccountDto {
  @IsEnum(KeyType)
  type: KeyType = KeyType.ED25519;

  @IsOptional()
  @IsString()
  alias: string;

  @IsOptional()
  @IsString()
  @IsNotIn(['buyer', 'receiver'])
  encryptionKey: string;
}
