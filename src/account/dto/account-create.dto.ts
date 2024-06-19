import {
  IsEnum,
  IsNotIn,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { DealAlias } from 'src/deal/deal-alias.enum';
import { KeyType } from 'src/key/key-type.enum';

export class AccountCreateDto {
  @IsEnum(KeyType)
  type: KeyType = KeyType.ED25519;

  @IsOptional()
  @IsString()
  @IsNotIn([DealAlias.PAYER, DealAlias.RECEIVER])
  alias?: string;

  @IsOptional()
  @IsString()
  payerId?: string

  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @IsOptional()
  @IsBoolean()
  receiverSignatureRequired?: boolean;

  @IsOptional()
  @IsNumber()
  maxAutomaticTokenAssociations?: number;

  @IsOptional()
  @IsString()
  stakedAccountId?: string;

  @IsOptional()
  @IsNumber()
  stakedNodeId?: number;

  @IsOptional()
  @IsBoolean()
  declineStakingReward?: boolean;

  @IsOptional()
  @IsString()
  accountMemo?: string;
}
