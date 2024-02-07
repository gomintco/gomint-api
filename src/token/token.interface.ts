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

export interface FixedFee {
  feeCollectorAccountId: string;
  hbarAmount: number;
  ftAmount: number;
  ftId: string;
  allCollectorsAreExempt: boolean;
}
