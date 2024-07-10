import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class FixedFeeDto {
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

export class FractionalFeeDto {
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

export class RoyaltyFeeDto {
  @IsString()
  feeCollectorAccountId: string;

  @IsNumber()
  numerator: number;

  @IsNumber()
  denominator: number;

  @IsOptional()
  @Type(() => FixedFeeDto)
  @ValidateNested()
  fallbackFee?: FixedFeeDto;

  @IsOptional()
  @IsBoolean()
  allCollectorsAreExempt?: boolean;
}
