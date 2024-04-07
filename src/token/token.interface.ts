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

export interface TokenMirrornodeInfo {
  admin_key: null | MirronodeKey;
  auto_renew_account: string;
  auto_renew_period: number;
  created_timestamp: string;
  custom_fees: MirronodeCustomFees;
  decimals: string;
  deleted: boolean;
  expiry_timestamp: number;
  fee_schedule_key: null | MirronodeKey;
  freeze_default: boolean;
  freeze_key: null | MirronodeKey;
  initial_supply: string;
  kyc_key: null | MirronodeKey;
  max_supply: string;
  memo: string;
  modified_timestamp: string;
  name: string;
  pause_key: null | MirronodeKey;
  pause_status: string;
  supply_key: null | MirronodeKey;
  supply_type: string;
  symbol: string;
  token_id: string;
  total_supply: string;
  treasury_account_id: string;
  type: string;
  wipe_key: null | MirronodeKey;
}

interface MirronodeCustomFees {
  created_timestamp: string;
  fixed_fees: FixedFee[];
  royalty_fees: MirronodeRoyaltyFee[];
}

interface MirronodeFixedFee {
  all_collectors_are_exempt: boolean;
  amount: number;
  collector_account_id: string;
  denominating_token_id: null | string;
}

interface MirronodeRoyaltyFee {
  all_collectors_are_exempt: boolean;
  amount: MirronodeFeeAmount;
  collector_account_id: string;
  fallback_fee: MirronodeFixedFee;
}

interface MirronodeFeeAmount {
  denominator: number;
  numerator: number;
}

interface MirronodeKey {
  _type: string;
  key: string;
}
