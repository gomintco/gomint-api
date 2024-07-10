import { CustomFee, TokenSupplyType, TokenType } from '@hashgraph/sdk';
import { TokenCreateKeys } from './pubKey.interface';

export interface AssociateTokenDto {
  associatingId: string;
  tokenIds: string[];
}

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
  metadata?: Uint8Array;
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
