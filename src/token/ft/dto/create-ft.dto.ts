import { IsNumber, IsOptional, IsString } from 'class-validator';

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
}
