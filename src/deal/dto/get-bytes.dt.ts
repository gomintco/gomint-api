import {
  IsNumber,
  IsString,
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';

export class GetBytesDto {
  @IsString()
  dealId: string;

  @IsString()
  buyerId: string;

  @IsString()
  @IsOptional()
  clientId: string;

  @IsString()
  encryptionKey: string;
}
