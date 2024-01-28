import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateNftDto {
  @IsString()
  tokenName: string;

  @IsString()
  tokenSymbol: string;

  @IsOptional() // defaults to main api account
  @IsString()
  treasuryAccountId: string;

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
  @IsString()
  encryptionKey: string;
}
