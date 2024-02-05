import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MintFtDto {
  @IsString()
  tokenId: string;

  @IsNumber()
  amount: number;

  @IsString()
  supplyKey: string = 'default';

  @IsOptional()
  @IsString()
  encryptionKey: string;
}
