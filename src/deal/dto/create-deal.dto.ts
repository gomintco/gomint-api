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
  @Type(() => HbarTransfer)
  hbarTransfers: HbarTransfer[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FtTransfer)
  ftTransfers: FtTransfer[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NftTransfer)
  nftTransfers: NftTransfer[] = [];
}

class HbarTransfer {
  @IsString()
  accountId: string;
  @IsNumber()
  amount: number;
}

class FtTransfer {
  @IsString()
  tokenId: string;
  @IsString()
  accountId: string;
  @IsNumber()
  amount: number;
}

class NftTransfer {
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
