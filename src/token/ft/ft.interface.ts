import { CustomFee, Key, TokenSupplyType } from '@hashgraph/sdk';

export interface FtCreateInput {
  tokenName: string;
  tokenSymbol: string;
  decimals?: number;
  initialSupply?: number;
  treasuryAccountId: string;
  adminKey?: Key;
  kycKey?: Key;
  freezeKey?: Key;
  wipeKey?: Key;
  supplyKey?: Key;
  pauseKey?: Key;
  feeScheduleKey?: Key;
  freezeDefault?: boolean;
  expirationTime?: Date;
  customFees?: CustomFee[];
  supplyType?: TokenSupplyType;
  maxSupply?: number;
  tokenMemo?: string;
  autoRenewAccountId?: string;
  autoRenewPeriod?: number;
}
