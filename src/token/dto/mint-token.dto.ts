import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class TokenMintDto {
  @IsIn(['ft', 'nft'])
  tokenType: string;

  @IsString()
  tokenId: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  supplyKey: string = 'default';

  @IsOptional()
  @IsString()
  payerId: string;

  @IsOptional()
  @IsString()
  encryptionKey: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metadatas?: string[] = [];

  @IsOptional()
  @IsString()
  metadata?: string;
}
