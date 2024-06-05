import { IsEnum, IsOptional, IsString } from 'class-validator';
import { KeyType } from 'src/key/key-type.enum';

export class CreateKeyDto {
  @IsEnum(KeyType)
  type: KeyType = KeyType.ED25519;

  @IsOptional()
  @IsString()
  encryptionKey: string;
}
