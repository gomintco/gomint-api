import { CustomFee, TokenSupplyType, TokenType } from '@hashgraph/sdk';
import { TokenCreateKeys } from './pubKey.interface';

export interface AssociateTokenDto {
  associatingId: string;
  tokenIds: string[];
}

//export interface TokenCreateDto extends TokenCreateKeysDto {
//  tokenName: string;
//  tokenSymbol: string;
//  tokenType: 'ft' | 'nft';
//  treasuryAccountId: string;
//  decimals?: number;
//  payerId?: string;
//  initialSupply?: number;
//  maxSupply?: number;
//  finite?: boolean;
//  expirationTime?: Date;
//  autoRenewAccountId?: string;
//  fixedFees?: FixedFeeDto[];
//  royaltyFees?: RoyaltyFeeDto[];
//  fractionalFees?: FractionalFeeDto[];
//}

export interface TokenCreateTransactionInput extends TokenCreateKeys {
  tokenName: string;
  tokenSymbol: string;
  tokenType: TokenType;
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
