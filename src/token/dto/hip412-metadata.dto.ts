import {
  IsString,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

class FileMetadata {
  @IsString()
  uri: string;

  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => FileMetadata)
  @IsOptional()
  metadata?: FileMetadata;
}

class Localization {
  @IsString()
  uri: string;

  @IsString()
  locale: string;
}

export class TokenMetadata {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  creator?: string;

  @IsString()
  @IsOptional()
  creatorDID?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @ValidateNested()
  @Type(() => FileMetadata)
  @IsOptional()
  files?: FileMetadata;

  @IsString()
  @IsOptional()
  format?: string;

  @IsObject()
  @IsOptional()
  properties?: object;

  @ValidateNested()
  @Type(() => Localization)
  @IsOptional()
  localization?: Localization;
}
