import {
  AccountId,
  Client,
  PrivateKey,
  Transaction,
  TransactionId,
  TransactionResponse,
} from '@hashgraph/sdk';
import { Injectable } from '@nestjs/common';

@Injectable()
export class TransactionService {
  async executeTransaction(
    transaction: Transaction,
    client: Client,
    signers?: PrivateKey[],
  ): Promise<TransactionResponse> {
    if (signers) await this.addSigners(transaction, signers);
    return transaction.execute(client);
  }

  freezeWithClient(transaction: Transaction, client: Client): Transaction {
    return transaction.freezeWith(client);
  }

  freezeWithPayer(transaction: Transaction, payerAccount: string): Transaction {
    return transaction
      .setNodeAccountIds([new AccountId(3)]) // is there a better way of doing this?
      .setTransactionId(TransactionId.generate(payerAccount))
      .freeze();
  }

  async addSigners(
    transaction: Transaction,
    signers: PrivateKey[],
  ): Promise<void> {
    if (!transaction.isFrozen())
      throw new Error(
        "Transaction is not frozen. You must freeze a transaction before calling 'addSigners'.",
      );
    await Promise.all(signers.map((signer) => transaction.sign(signer)));
  }
}
