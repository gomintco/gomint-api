import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import {
  FixedFeeDto,
  FractionalFeeDto,
  RoyaltyFeeDto,
} from './custom-fees.dto';
import { TokenCollectionMetadata } from './hip766-metadata.dto';

@ValidatorConstraint({
  name: 'isStringOrTokenCollectionMetadata',
  async: false,
})
class IsStringOrTokenCollectionMetadata
  implements ValidatorConstraintInterface
{
  validate(value: any, _args: ValidationArguments) {
    // Valid if string
    if (typeof value === 'string') {
      return true;
    }

    // Validation if value is object
    if (typeof value === 'object' && value !== null) {
      const validKeys = [
        'description',
        'smallestUnitName',
        'smallestUnitSymbol',
        'creator',
        'creatorDID',
        'admin',
        'website',
        'discussion',
        'whitepaper',
        'properties',
        'socials',
        'lightLogo',
        'lightLogoType',
        'lightBanner',
        'lightBannerType',
        'lightFeaturedImage',
        'lightFeaturedImageType',
        'darkLogo',
        'darkLogoType',
        'darkBanner',
        'darkBannerType',
        'darkFeaturedImage',
        'darkFeaturedImageType',
      ];

      for (const key in value) {
        if (!validKeys.includes(key)) {
          return false;
        }
        if (
          value[key] !== undefined &&
          typeof value[key] !== 'string' &&
          typeof value[key] !== 'object' &&
          !Array.isArray(value[key])
        ) {
          return false;
        }
      }
      return true;
    }
    return false;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Value must be either a string or a valid TokenCollectionMetadata object';
  }
}

export class TokenCreateDto {
  @IsOptional()
  @IsString()
  payerId?: string;

  @IsString()
  tokenName: string;

  @IsIn(['ft', 'nft'])
  tokenType: string;

  @IsString()
  tokenSymbol: string;

  @IsOptional()
  @IsNumber()
  decimals?: number = 0;

  @IsOptional()
  @IsNumber()
  initialSupply?: number;

  @IsString()
  treasuryAccountId: string;

  @IsOptional()
  @IsString()
  adminKey?: string;

  @IsOptional()
  @IsString()
  kycKey?: string;

  @IsOptional()
  @IsString()
  freezeKey?: string;

  @IsOptional()
  @IsString()
  wipeKey?: string;

  @IsOptional()
  @IsString()
  supplyKey?: string = 'default';

  @IsOptional()
  @IsString()
  feeScheduleKey?: string;

  @IsOptional()
  @IsString()
  pauseKey?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FixedFeeDto)
  fixedFees?: FixedFeeDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FractionalFeeDto)
  fractionalFees?: FractionalFeeDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RoyaltyFeeDto)
  royaltyFees?: RoyaltyFeeDto[];

  @IsOptional()
  @IsNumber()
  maxSupply?: number;

  @IsOptional()
  @IsBoolean()
  finite?: boolean = false;

  @IsOptional()
  @IsNumber()
  expirationTime?: number;

  @IsOptional()
  @IsString()
  autoRenewAccountId?: string;

  @IsOptional()
  @IsString()
  metadataKey?: string;

  @IsOptional()
  @Validate(IsStringOrTokenCollectionMetadata)
  metadata?: string | TokenCollectionMetadata;
}
