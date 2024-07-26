import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from 'src/account/account.service';
import { ClientService } from 'src/client/client.service';
import { HederaConsensusApiService } from 'src/hedera-api/hedera-consensus-api/hedera-consensus-api.service';
import { KeyService } from 'src/key/key.service';
import { User } from 'src/user/user.entity';
import { TopicCreateDto } from './dto';
import { NoPayerIdError } from 'src/core/error';
import { Account } from 'src/account/account.entity';
import NodeClient from '@hashgraph/sdk/lib/client/NodeClient';
import { PublicKey } from '@hashgraph/sdk';

@Injectable()
export class ConsensusMediator {
  private readonly _logger = new Logger(ConsensusMediator.name);

  constructor(
    private readonly hederaConsensusApiService: HederaConsensusApiService,
    private readonly clientService: ClientService,
    private readonly keyService: KeyService,
    private readonly accountService: AccountService,
  ) {}

  async createTopic(
    user: User,
    dto: TopicCreateDto,
    encryptionKey?: string,
  ): Promise<string> {
    const client = await this.getTopicCreateClient(user, dto, encryptionKey);
    const topicId = await this.hederaConsensusApiService.createTopic(client, {
      adminKey: dto.adminKey ? PublicKey.fromString(dto.adminKey) : undefined,
      submitKey: dto.submitKey
        ? PublicKey.fromString(dto.submitKey)
        : undefined,
      autoRenewPeriod: dto.autoRenewPeriod,
      autoRenewAccountId: dto.autoRenewAccount,
      topicMemo: dto.topicMemo,
    });
    return topicId.toString();
  }

  private async getTopicCreateClient(
    user: User,
    dto: TopicCreateDto,
    encryptionKey?: string,
  ): Promise<NodeClient> {
    const escrowKey = this.keyService.decryptUserEscrowKey(user, encryptionKey);
    const payerAccount = await this.getTopicCreatePayerAccount(user, dto);

    // check if the payer account is accessible for this user
    const client = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      payerAccount,
    ).client;

    return client;
  }

  private async getTopicCreatePayerAccount(
    user: User,
    dto: TopicCreateDto,
  ): Promise<Account> {
    if (dto.payerId) {
      console.log(dto.payerId);
      const account = await this.accountService.getUserAccountByAlias(
        user.id,
        dto.payerId,
      );
      console.log('success');
      return account;
    }

    const payerKey = dto.adminKey ?? dto.submitKey;
    if (!payerKey) {
      throw new NoPayerIdError();
    }
    return await this.accountService.getUserAccountByPublicKey(
      user.id,
      payerKey,
    );
  }
}
