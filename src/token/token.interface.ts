import { PublicKey } from '@hashgraph/sdk';

export interface TokenPublicKeys {
  adminKey?: PublicKey;
  freezeKey?: PublicKey;
  kycKey?: PublicKey;
  pauseKey?: PublicKey;
  supplyKey?: PublicKey;
  wipeKey?: PublicKey;
  feeScheduleKey?: PublicKey;
}
