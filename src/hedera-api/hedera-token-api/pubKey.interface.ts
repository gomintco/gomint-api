import { PublicKey } from '@hashgraph/sdk';

export interface TokenCreateKeys {
  adminKey?: PublicKey;
  kycKey?: PublicKey;
  freezeKey?: PublicKey;
  wipeKey?: PublicKey;
  supplyKey?: PublicKey;
  pauseKey?: PublicKey;
  feeScheduleKey?: PublicKey;
  metadataKey?: PublicKey;
}
