import { PublicKey } from '@hashgraph/sdk';

export interface TokenCreateKeysDto {
  adminKey?: string;
  kycKey?: string;
  freezeKey?: string;
  wipeKey?: string;
  supplyKey?: string;
  pauseKey?: string;
  feeScheduleKey?: string;
}

export interface TokenCreateKeys {
  adminKey?: PublicKey;
  kycKey?: PublicKey;
  freezeKey?: PublicKey;
  wipeKey?: PublicKey;
  supplyKey?: PublicKey;
  pauseKey?: PublicKey;
  feeScheduleKey?: PublicKey;
}
