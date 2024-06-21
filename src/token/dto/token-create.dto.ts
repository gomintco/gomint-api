import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FixedFee, FractionalFee, RoyaltyFee } from './custom-fees.dto';
import { TokenCollectionMetadata } from './hip766-metadata.dto';

export class TokenCreateDto {
  @IsString()
  tokenName: string;

  @IsString()
  tokenSymbol: string;

  @IsIn(['ft', 'nft'])
  tokenType: string;

  @IsString()
  treasuryAccountId: string;

  @IsOptional()
  @IsString()
  payerId: string;

  @IsOptional()
  @IsNumber()
  decimals: number = 0;

  @IsOptional()
  @IsNumber()
  initialSupply: number;

  @IsOptional()
  @IsNumber()
  maxSupply: number;

  @IsOptional()
  @IsBoolean()
  finite: boolean = false;

  @IsOptional()
  @IsNumber()
  expirationTime: number;

  @IsOptional()
  @IsString()
  autoRenewAccountId: string;

  @IsString()
  supplyKey: string = 'default';

  @IsOptional()
  @IsString()
  adminKey: string;

  @IsOptional()
  @IsString()
  freezeKey: string;

  @IsOptional()
  @IsString()
  kycKey: string;

  @IsOptional()
  @IsString()
  pauseKey: string;

  @IsOptional()
  @IsString()
  wipeKey: string;

  @IsOptional()
  @IsString()
  feeScheduleKey: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FixedFee)
  fixedFees: FixedFee[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FractionalFee)
  fractionalFees: FractionalFee[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoyaltyFee)
  royaltyFees: RoyaltyFee[];

  @IsOptional()
  @IsString()
  metadataKey?: string;

  @IsOptional()
  metadata?: TokenCollectionMetadata;
}
