import { Key } from '../key/key.entity';

export interface AccountCreateInput {
  key: Key; // this should really be an array of keys to allow for multi sig
  // userId: string;
  // or maybe we have a separate interface for multi sig
  alias?: string;
  initialBalance?: number;
  receiverSignatureRequired?: boolean;
  maxAutomaticTokenAssociations?: number;
  stakedAccountId?: string;
  stakedNodeId?: number;
  declineStakingReward?: boolean;
  accountMemo?: string;
}
