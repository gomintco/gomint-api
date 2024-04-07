import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
  ValidateNested,
  Min,
} from 'class-validator';

export class CreateFtDto {
  @IsString()
  tokenName: string;

  @IsString()
  tokenSymbol: string;

  @IsString()
  treasuryAccountId: string;

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
  @IsString()
  supplyKey: string;

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

export class FractionalFee {
  @IsString()
  feeCollectorAccountId: string;

  @IsNumber()
  numerator: number;

  @IsNumber()
  denominator: number;

  @IsOptional()
  @IsNumber()
  max: number;

  @IsOptional()
  @IsNumber()
  min: number;

  @IsOptional()
  @IsBoolean()
  senderPaysFees: boolean; // this maps to .setAssessmentMethod() in the sdk

  @IsOptional()
  @IsBoolean()
  allCollectorsAreExempt: boolean;
}
