import {
  CustomFee,
  Key,
  PublicKey,
  TokenSupplyType,
  TokenType,
} from '@hashgraph/sdk';
import { CreateTokenKeys, CreateTokenKeysDto } from './pubKey.interface';
import { FixedFeeDto, FractionalFeeDto, RoyaltyFeeDto } from './fee.interface';

export interface AssociateTokenDto {
  associatingId: string;
  tokenIds: string[];
}

export interface CreateTokenDto extends CreateTokenKeysDto {
  tokenName: string;
  tokenSymbol: string;
  treasuryAccountId: string;
  decimals?: number;
  payerId?: string;
  initialSupply?: number;
  maxSupply?: number;
  finite?: boolean;
  expirationTime?: Date;
  autoRenewAccountId?: string;
  fixedFees?: FixedFeeDto[];
  royaltyFees?: RoyaltyFeeDto[];
  fractionalFees?: FractionalFeeDto[];
}

export interface CreateTokenTransaction extends CreateTokenKeys {
  tokenName: string;
  tokenSymbol: string;
  decimals?: number;
  treasuryAccountId: string;
  initialSupply?: number;
  freezeDefault?: boolean;
  expirationTime?: Date;
  customFees?: CustomFee[];
  supplyType?: TokenSupplyType;
  maxSupply?: number;
  tokenMemo?: string;
  autoRenewAccountId?: string;
  autoRenewPeriod?: number;
}

export interface MintFtDto {
  tokenId: string;
  amount: number;
}

export interface MintNftDto {
  tokenId: string;
  metadata?: string;
  metadatas?: string[];
  amount?: number;
}
