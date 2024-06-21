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
  @IsOptional()
  @IsString()
  payerId: string;

  @IsString()
  tokenName: string;

  @IsIn(['ft', 'nft'])
  tokenType: string;

  @IsString()
  tokenSymbol: string;
  
  @IsOptional()
  @IsNumber()
  decimals: number = 0;

  @IsOptional()
  @IsNumber()
  initialSupply: number;


  @IsString()
  treasuryAccountId: string;


  @IsOptional()
  @IsString()
  adminKey: string;

  @IsOptional()
  @IsString()
  kycKey: string;

  @IsOptional()
  @IsString()
  freezeKey: string;

  @IsOptional()
  @IsString()
  wipeKey: string;

  @IsString()
  supplyKey: string = 'default';

  @IsOptional()
  @IsString()
  feeScheduleKey: string;

  @IsOptional()
  @IsString()
  pauseKey: string;

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
 
  @IsOptional()
  @IsString()
  metadataKey?: string;

  @IsOptional()
  metadata?: TokenCollectionMetadata;
}
