import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Network } from 'src/app.interface';

export class GetBytesDto {
  @IsEnum(Network)
  network: Network;

  @IsString()
  dealId: string;

  @IsString()
  receiverId: string;

  @IsString()
  @IsOptional()
  payerId: string | undefined;

  @IsNumber()
  @IsOptional()
  serial: number;

  @IsString()
  encryptionKey: string;
}
