import { PublicKey } from '@hashgraph/sdk';

export interface CreateTokenKeysDto {
  adminKey?: string;
  kycKey?: string;
  freezeKey?: string;
  wipeKey?: string;
  supplyKey?: string;
  pauseKey?: string;
  feeScheduleKey?: string;
}

export interface CreateTokenKeys {
  adminKey?: PublicKey;
  kycKey?: PublicKey;
  freezeKey?: PublicKey;
  wipeKey?: PublicKey;
  supplyKey?: PublicKey;
  pauseKey?: PublicKey;
  feeScheduleKey?: PublicKey;
}
