import { AccountCreateTransaction } from '@hashgraph/sdk';
import { Injectable } from '@nestjs/common';
import { AccountCreateInput } from './account.interface';

@Injectable()
export class AccountService {
  createTransaction(
    accountCreateInput: AccountCreateInput,
  ): AccountCreateTransaction {
    const transaction = new AccountCreateTransaction()
      .setKey(accountCreateInput.key)
      .setInitialBalance(accountCreateInput.initialBalance)
      .setReceiverSignatureRequired(
        accountCreateInput.receiverSignatureRequired,
      )
      .setMaxAutomaticTokenAssociations(
        accountCreateInput.maxAutomaticTokenAssociations,
      )
      .setStakedAccountId(accountCreateInput.stakedAccountId)
      .setStakedNodeId(accountCreateInput.stakedNodeId)
      .setDeclineStakingReward(accountCreateInput.declineStakingReward)
      .setAccountMemo(accountCreateInput.accountMemo);
    // .setAutoRenewPeriod(accountCreateInput.autoRenewPeriod)
    return transaction;
  }
}
