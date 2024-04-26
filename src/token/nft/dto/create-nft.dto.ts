import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateNftDto {
  @IsString()
  tokenName: string;

  @IsString()
  tokenSymbol: string;

  @IsString()
  treasuryAccountId: string;

  @IsOptional()
  @IsString()
  payerId: string;

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
  @IsNumber()
  maxSupply: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FixedFee)
  fixedFees: FixedFee[];

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
  hbarAmount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  ftAmount: number;

  @IsOptional()
  @IsString()
  ftId: string;

  @IsOptional()
  @IsBoolean()
  allCollectorsAreExempt: boolean;
}

export class RoyaltyFee {
  @IsString()
  feeCollectorAccountId: string;

  @IsNumber()
  numerator: number;

  @IsNumber()
  denominator: number;

  @IsOptional()
  @Type(() => FixedFee)
  @ValidateNested()
  fallbackFee: FixedFee;

  @IsOptional()
  @IsBoolean()
  allCollectorsAreExempt: boolean;
}
