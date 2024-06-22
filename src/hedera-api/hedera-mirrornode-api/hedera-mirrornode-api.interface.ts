export interface TokenMirrornodeInfo {
  admin_key: null | MirrornodeKey;
  auto_renew_account: string;
  auto_renew_period: number;
  created_timestamp: string;
  custom_fees: MirrornodeCustomFees;
  decimals: string;
  deleted: boolean;
  expiry_timestamp: number;
  fee_schedule_key: null | MirrornodeKey;
  freeze_default: boolean;
  freeze_key: null | MirrornodeKey;
  initial_supply: string;
  kyc_key: null | MirrornodeKey;
  max_supply: string;
  memo: string;
  modified_timestamp: string;
  name: string;
  pause_key: null | MirrornodeKey;
  pause_status: string;
  supply_key: null | MirrornodeKey;
  supply_type: string;
  symbol: string;
  token_id: string;
  total_supply: string;
  treasury_account_id: string;
  type: string;
  wipe_key: null | MirrornodeKey;
}

interface FixedFee {
  feeCollectorAccountId: string;
  hbarAmount: number;
  ftAmount: number;
  ftId: string;
  allCollectorsAreExempt: boolean;
}

interface MirrornodeCustomFees {
  created_timestamp: string;
  fixed_fees: FixedFee[];
  royalty_fees: MirrornodeRoyaltyFee[];
}

interface MirrornodeFixedFee {
  all_collectors_are_exempt: boolean;
  amount: number;
  collector_account_id: string;
  denominating_token_id: null | string;
}

interface MirrornodeRoyaltyFee {
  all_collectors_are_exempt: boolean;
  amount: MirrornodeFeeAmount;
  collector_account_id: string;
  fallback_fee: MirrornodeFixedFee;
}

interface MirrornodeFeeAmount {
  denominator: number;
  numerator: number;
}

interface MirrornodeKey {
  _type: string;
  key: string;
}
