import { Key } from '@hashgraph/sdk';

export interface AccountCreateInput {
  key: Key;
  initialBalance?: number;
  receiverSignatureRequired?: boolean;
  maxAutomaticTokenAssociations?: number;
  stakedAccountId?: string;
  stakedNodeId?: number;
  declineStakingReward?: boolean;
  accountMemo?: string;
  // autoRenewPeriod?: number
}
