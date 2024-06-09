import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

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
  encryptionKey: string;
}

class FixedFee {
  @IsString()
  feeCollectorAccountId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hbarAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ftAmount?: number;

  @IsOptional()
  @IsString()
  ftId?: string;

  @IsOptional()
  @IsBoolean()
  allCollectorsAreExempt?: boolean;
}

class FractionalFee {
  @IsString()
  feeCollectorAccountId: string;

  @IsNumber()
  numerator: number;

  @IsNumber()
  denominator: number;

  @IsOptional()
  @IsNumber()
  max?: number;

  @IsOptional()
  @IsNumber()
  min?: number;

  @IsOptional()
  @IsBoolean()
  senderPaysFees?: boolean;

  @IsOptional()
  @IsBoolean()
  allCollectorsAreExempt?: boolean;
}

class RoyaltyFee {
  @IsString()
  feeCollectorAccountId: string;

  @IsNumber()
  numerator: number;

  @IsNumber()
  denominator: number;

  @IsOptional()
  @Type(() => FixedFee)
  @ValidateNested()
  fallbackFee?: FixedFee;

  @IsOptional()
  @IsBoolean()
  allCollectorsAreExempt?: boolean;
}
