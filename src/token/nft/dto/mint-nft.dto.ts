import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class MintNftDto {
  @IsString()
  tokenId: string;

  @IsOptional()
  @IsString()
  payerId: string;

  @IsArray()
  @IsString({ each: true })
  metadatas: string[] = [];

  @IsString()
  @IsOptional()
  metadata: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  amount: number;

  @IsString()
  supplyKey: string = 'default';

  @IsOptional()
  @IsString()
  encryptionKey: string;
}
