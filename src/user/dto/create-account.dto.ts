import { IsEnum, IsNotIn, IsOptional, IsString } from 'class-validator';
import { DealAlias } from 'src/deal/deal-alias.enum';
import { KeyType } from 'src/key/key-type.enum';

export class CreateAccountDto {
  @IsEnum(KeyType)
  type: KeyType = KeyType.ED25519;

  @IsOptional()
  @IsString()
  @IsNotIn([DealAlias.PAYER, DealAlias.RECEIVER])
  alias: string;

  @IsOptional()
  @IsString()
  encryptionKey: string;
}
