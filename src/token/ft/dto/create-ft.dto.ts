import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

export class CreateFtDto {
  @IsString()
  tokenName: string;

  @IsString()
  tokenSymbol: string;

  @IsOptional() // defaults to main api account
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
  @IsString()
  encryptionKey: string;
}
