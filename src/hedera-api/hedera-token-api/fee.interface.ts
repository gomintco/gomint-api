export type FeeDto = FixedFeeDto | FractionalFeeDto | RoyaltyFeeDto;

export interface FixedFeeDto {
  feeCollectorAccountId: string;
  hbarAmount?: number;
  ftAmount?: number;
  ftId?: string;
  allCollectorsAreExempt?: boolean;
}

export interface FractionalFeeDto {
  feeCollectorAccountId: string;
  numerator: number;
  denominator: number;
  min?: number;
  max?: number;
  senderPaysFees?: boolean;
  allCollectorsAreExempt?: boolean;
}

export interface RoyaltyFeeDto {
  feeCollectorAccountId: string;
  numerator: number;
  denominator: number;
  fallbackFee?: FixedFeeDto;
  allCollectorsAreExempt?: boolean;
}
