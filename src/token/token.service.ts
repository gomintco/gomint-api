import { Injectable } from '@nestjs/common';
import { HederaTokenApiService } from '../hedera-api/hedera-token-api/hedera-token-api.service';
import { User } from '../user/user.entity';
import { TokenAssociateDto } from './dto/token-associate.dto';
import { AccountService } from '../account/account.service';
import { KeyService } from '../key/key.service';
import { ClientService } from '../client/client.service';
import { HederaTransactionApiService } from '../hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { Account } from '../account/account.entity';
import { AccountNotFoundError } from '../core/error';

@Injectable()
export class TokenService {
  constructor(
    private readonly hederaTokenApiService: HederaTokenApiService,
    private readonly accountService: AccountService,
    private readonly keyService: KeyService,
    private readonly clientService: ClientService,
    private readonly hederaTransactionApiService: HederaTransactionApiService,
  ) {}

  async tokenAssociateHandler(
    user: User,
    tokenAssociateDto: TokenAssociateDto,
    encryptionKey?: string,
  ) {
    const escrowKey = this.keyService.decryptUserEscrowKey(user, encryptionKey);
    let associatingAccount: Account;
    try {
      associatingAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        tokenAssociateDto.associatingId,
      );
    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        throw new AccountNotFoundError(
          'Unable to find account with associatingId',
        );
      }
      throw error;
    }
    tokenAssociateDto.associatingId = associatingAccount.id;

    // handle case if payerId is separate
    let payerAccount: Account;
    if (tokenAssociateDto.payerId) {
      try {
        payerAccount = await this.accountService.getUserAccountByAlias(
          user.id,
          tokenAssociateDto.payerId,
        );
      } catch (error) {
        if (error instanceof AccountNotFoundError) {
          throw new AccountNotFoundError(
            'Unable to find account with payerId: ' + tokenAssociateDto.payerId,
          );
        }
        throw error;
      }
    }
    // build client and signers
    const { client, signers } = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      associatingAccount,
      payerAccount,
    );
    // handle token associate transaction
    const transaction =
      this.hederaTokenApiService.associateTransaction(tokenAssociateDto);
    const receipt =
      await this.hederaTransactionApiService.freezeSignExecuteAndGetReceipt(
        transaction,
        client,
        signers,
      );
    return receipt.status.toString();
  }
}
