import { AccountCreateTransaction, Key } from '@hashgraph/sdk';
import { Injectable } from '@nestjs/common';
import { AccountCreateDto } from 'src/account/dto/account-create.dto';

@Injectable()
export class HederaAccountApiService {

  createTransaction(
    accountCreateDto: AccountCreateDto,
    key: Key
  ): AccountCreateTransaction {
    //const accountCreateDto = this.parseCreateTransaction(accountCreateDto)
    const transaction = new AccountCreateTransaction()
      .setKey(key)
      .setInitialBalance(accountCreateDto.initialBalance)
      .setReceiverSignatureRequired(
        accountCreateDto.receiverSignatureRequired,
      )
      .setMaxAutomaticTokenAssociations(
        accountCreateDto.maxAutomaticTokenAssociations,
      )
      .setStakedAccountId(accountCreateDto.stakedAccountId)
      //.setStakedNodeId(accountCreateDto.stakedNodeId) // this causes an error when undefined
      .setDeclineStakingReward(accountCreateDto.declineStakingReward)
      .setAccountMemo(accountCreateDto.accountMemo);
    // .setAutoRenewPeriod(accountCreateDto.autoRenewPeriod)
    return transaction;
  }
}
