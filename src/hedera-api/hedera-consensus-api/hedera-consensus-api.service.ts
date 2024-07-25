import { AccountId, Key, TopicCreateTransaction } from '@hashgraph/sdk';
import NodeClient from '@hashgraph/sdk/lib/client/NodeClient';
import { Injectable } from '@nestjs/common';

@Injectable()
export class HederaConsensusApiService {
  async createTopic(
    client: NodeClient,
    props?: {
      adminKey?: Key;
      submitKey?: Key;
      autoRenewPeriod?: number;
      autoRenewAccountId?: string | AccountId;
      topicMemo?: string;
    },
  ) {
    const transaction = new TopicCreateTransaction(props);
    const txResponse = await transaction.execute(client);
    const receipt = await txResponse.getReceipt(client);
    const newTopicId = receipt.topicId;
    return newTopicId;
  }
}
