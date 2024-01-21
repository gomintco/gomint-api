import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ClientService } from '../../client/client.service';

import { FtCreateInput } from './ft.interface';
import { Key, TokenCreateTransaction, TokenType, Client } from '@hashgraph/sdk';

@Injectable()
export class FtService {
  constructor(private clientService: ClientService) {}

  async createTransactionAndExecute(
    ftCreateInput: FtCreateInput,
    client: Client,
  ) {
    const transaction = this.createTransaction(ftCreateInput);
    transaction.freezeWith(client);
    try {
      //   const keysToSignWith = this.uniqueKeys(ftCreateInput);
      // here we need all private keys for the respective public keys
      // await Promise.all([...keysToSignWith].map(key => transaction.sign(key)));
      // lets leave for now...
      const submit = await transaction.execute(client);
      const receipt = await submit.getReceipt(client);
      return receipt.tokenId.toString();
    } catch (err) {
      console.error(err);
      throw new ServiceUnavailableException("Couldn't create Hedera token", {
        cause: err,
        description: err.message,
      });
    }
  }

  private uniqueKeys(ftCreateInput: FtCreateInput) {
    const keys = [
      ftCreateInput.adminKey,
      ftCreateInput.freezeKey,
      ftCreateInput.kycKey,
      ftCreateInput.pauseKey,
      ftCreateInput.supplyKey,
      ftCreateInput.wipeKey,
    ].filter((key) => key != undefined);
    return new Set<Key>(keys);
  }

  private createTransaction(ftCreateInput: FtCreateInput) {
    const transaction = new TokenCreateTransaction()
      .setTokenName(ftCreateInput.tokenName)
      .setTokenSymbol(ftCreateInput.tokenSymbol)
      .setDecimals(ftCreateInput.decimals)
      .setInitialSupply(ftCreateInput.initialSupply)
      .setTreasuryAccountId(ftCreateInput.treasuryAccountId);
    //   .setAdminKey(ftCreateInput.adminKey)
    //   .setKycKey(ftCreateInput.kycKey)
    //   .setFreezeKey(ftCreateInput.freezeKey)
    //   .setWipeKey(ftCreateInput.wipeKey)
    //   .setSupplyKey(ftCreateInput.supplyKey)
    //   .setPauseKey(ftCreateInput.pauseKey)
    //   .setFreezeDefault(ftCreateInput.freezeDefault)
    //   .setExpirationTime(ftCreateInput.expirationTime)
    //   .setFeeScheduleKey(ftCreateInput.feeScheduleKey)
    //   .setCustomFees(ftCreateInput.customFees)
    //   .setSupplyType(ftCreateInput.supplyType)
    //   .setMaxSupply(ftCreateInput.maxSupply)
    //   .setTokenMemo(ftCreateInput.tokenMemo);
    //   .setAutoRenewAccountId(ftCreateInput.autoRenewAccountId)
    //   .setAutoRenewPeriod(ftCreateInput.autoRenewPeriod);

    return transaction;
  }
}
