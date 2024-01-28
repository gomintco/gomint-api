import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KeyType } from '../../app.interface';

export class CreateAccountDto {
  @IsEnum(KeyType)
  type: KeyType = KeyType.ED25519;

  @IsOptional()
  @IsString()
  encryptionKey: string;
}
