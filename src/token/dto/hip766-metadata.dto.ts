import {
  IsString,
  IsOptional,
  ValidateNested,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SocialLink {
  @IsString()
  url: string;

  @IsString()
  label: string;

  @IsString()
  @IsOptional()
  info?: string;
}

export class TokenCollectionMetadata {
  @IsString()
  @IsOptional()
  description?: string;


  @IsString()
  @IsOptional()
  smallestUnitName?: string


  @IsString()
  @IsOptional()
  smallestUnitSymbol?: string

  @IsString()
  @IsOptional()
  creator?: string;

  @IsString()
  @IsOptional()
  creatorDID?: string;

  @IsString()
  @IsOptional()
  admin?: string;

  @IsString()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  discussion?: string;

  @IsString()
  @IsOptional()
  whitepaper?: string;

  @IsObject()
  @IsOptional()
  properties?: object;

  @ValidateNested({ each: true })
  @Type(() => SocialLink)
  @IsArray()
  @IsOptional()
  socials?: SocialLink[];

  @IsString()
  @IsOptional()
  lightLogo?: string;

  @IsString()
  @IsOptional()
  lightLogoType?: string;

  @IsString()
  @IsOptional()
  lightBanner?: string;

  @IsString()
  @IsOptional()
  lightBannerType?: string;

  @IsString()
  @IsOptional()
  lightFeaturedImage?: string;

  @IsString()
  @IsOptional()
  lightFeaturedImageType?: string;

  @IsString()
  @IsOptional()
  darkLogo?: string;

  @IsString()
  @IsOptional()
  darkLogoType?: string;

  @IsString()
  @IsOptional()
  darkBanner?: string;

  @IsString()
  @IsOptional()
  darkBannerType?: string;

  @IsString()
  @IsOptional()
  darkFeaturedImage?: string;

  @IsString()
  @IsOptional()
  darkFeaturedImageType?: string;
}
