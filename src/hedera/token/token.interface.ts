import {
  CustomFee,
  Key,
  PublicKey,
  TokenSupplyType,
  TokenType,
} from '@hashgraph/sdk';
import { CreateTokenKeys, CreateTokenKeysDto } from './pubKey.interface';
import { FixedFeeDto, FractionalFeeDto, RoyaltyFeeDto } from './fee.interface';

export interface CreateTokenDto extends CreateTokenKeysDto {
  tokenName: string;
  tokenSymbol: string;
  treasuryAccountId: string;
  decimals?: number;
  payerId?: string;
  initialSupply?: number;
  maxSupply?: number;
  finite?: boolean;
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