import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class AssociateDto {
  @IsString()
  associatingId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tokenIds: string[];

  @IsOptional()
  @IsString()
  encryptionKey: string;

  @IsOptional()
  @IsString()
  payerId: string;
}
