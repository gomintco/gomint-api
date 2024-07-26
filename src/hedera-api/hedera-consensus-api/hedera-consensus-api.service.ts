import {
  type AccountId,
  type Key,
  TopicCreateTransaction,
  TopicId,
  Client,
} from '@hashgraph/sdk';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HederaConsensusApiService {
  async createTopic(
    client: Client,
    props?: {
      adminKey?: Key;
      submitKey?: Key;
      autoRenewPeriod?: number;
      autoRenewAccountId?: string | AccountId;
      topicMemo?: string;
    },
  ): Promise<TopicId> {
    const transaction = new TopicCreateTransaction(props);
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    return receipt.topicId;
  }
}
