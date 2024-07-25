import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from 'src/account/account.service';
import { ClientService } from 'src/client/client.service';
import { HederaConsensusApiService } from 'src/hedera-api/hedera-consensus-api/hedera-consensus-api.service';
import { KeyService } from 'src/key/key.service';
import { User } from 'src/user/user.entity';
import { TopicCreateDto } from './dtos';
import { AccountNotFoundError } from 'src/core/error';
import { Account } from 'src/account/account.entity';
import NodeClient from '@hashgraph/sdk/lib/client/NodeClient';

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
    const topicId = await this.hederaConsensusApiService.createTopic(client);
    return topicId.toString();
  }

  private async getTopicCreateClient(
    user: User,
    dto: TopicCreateDto,
    encryptionKey?: string,
  ): Promise<NodeClient> {
    const escrowKey = this.keyService.decryptUserEscrowKey(user, encryptionKey);
    let payerAccount: Account;

    try {
      if (dto.payerId) {
        payerAccount = await this.accountService.getUserAccountByAlias(
          user.id,
          dto.payerId,
        );
      } else {
        const payerKey = dto.adminKey ?? dto.submitKey;
        payerAccount = await this.accountService.getUserAccountByPublicKey(
          user.id,
          payerKey,
        );
      }
    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        throw new AccountNotFoundError('Payer account not found');
      }
      throw error;
    }

    // check if the payer account is accessible for this user
    const client = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      payerAccount,
    ).client;

    return client;
  }
}
