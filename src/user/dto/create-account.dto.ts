import { IsEnum, IsNotIn, IsOptional, IsString } from 'class-validator';
import { KeyType } from '../../app.interface';

export class CreateAccountDto {
  @IsEnum(KeyType)
  type: KeyType = KeyType.ED25519;

  @IsOptional()
  @IsString()
  @IsNotIn(['buyer', 'receiver'])
  alias: string;

  @IsOptional()
  @IsString()
  encryptionKey: string;
}
