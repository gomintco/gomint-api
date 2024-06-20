import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

export class TokenAssociateDto {
  @IsString()
  associatingId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tokenIds: string[];

  @IsOptional()
  @IsString()
  payerId: string;
}
