import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TokenMetadata } from './hip412-metadata.dto';

@ValidatorConstraint({ name: 'isStringOrTokenMetadata', async: false })
class IsStringOrTokenMetadata implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    // valid if string
    if (typeof value === 'string') {
      return true;
    }
    // validation if value is object
    if (typeof value === 'object' && value !== null) {
      const tokenMetadataKeys = [
        'name',
        'description',
        'creator',
        'creatorDID',
        'image',
        'type',
        'files',
        'format',
        'properties',
        'localization',
      ];
      for (const key in value) {
        // Check if the key is not in the tokenMetadataKeys list
        if (!tokenMetadataKeys.includes(key)) {
          return false;
        }
        // check if it is correct type
        if (
          value[key] !== undefined &&
          typeof value[key] !== 'string' &&
          typeof value[key] !== 'object' // technically could be even more precise here
        ) {
          return false;
        }
      }
      return value.hasOwnProperty('name') && typeof value.name === 'string';
    }
    return false;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Value must be either a string or a HIP-412 compliant object';
  }
}

export class TokenMintDto {
  @IsIn(['ft', 'nft'])
  tokenType: string;

  @IsString()
  tokenId: string;

  @IsNumber()
  @IsOptional()
  amount?: number;

  @IsString()
  supplyKey: string = 'default';

  @IsOptional()
  @IsString()
  payerId: string;

  @IsOptional()
  @IsString()
  encryptionKey: string;

  @IsOptional()
  @IsArray()
  @Validate(IsStringOrTokenMetadata, { each: true })
  metadatas?: (string | TokenMetadata)[] = [];

  @IsOptional()
  @Validate(IsStringOrTokenMetadata)
  metadata?: string | TokenMetadata;
}
