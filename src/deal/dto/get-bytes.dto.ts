import { Type } from 'class-transformer';
import {
  IsNumber,
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
} from 'class-validator';
import { Network } from 'src/hedera-api/network.enum';

export class GetBytesDto {
  @IsEnum(Network)
  @IsNotEmpty()
  network: Network;

  @IsString()
  @IsNotEmpty()
  receiverId: string;

  @IsString()
  @IsOptional()
  payerId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  serial: number;
}
