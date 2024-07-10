import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDealDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HbarTransferDto)
  hbarTransfers: HbarTransferDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FtTransferDto)
  ftTransfers: FtTransferDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NftTransferDto)
  nftTransfers: NftTransferDto[] = [];
}

class HbarTransferDto {
  @IsString()
  accountId: string;
  @IsNumber()
  amount: number;
}

class FtTransferDto {
  @IsString()
  tokenId: string;
  @IsString()
  accountId: string;
  @IsNumber()
  amount: number;
}

class NftTransferDto {
  @IsString()
  tokenId: string;
  @IsString()
  senderId: string;

  @IsString()
  receiverId: string;

  @IsNumber()
  @IsOptional()
  serialNumber: number;
}
