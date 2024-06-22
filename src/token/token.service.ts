import { Injectable } from '@nestjs/common';
import { HederaTokenApiService } from 'src/hedera-api/hedera-token-api/hedera-token-api.service';
import { User } from 'src/user/user.entity';
import { TokenAssociateDto } from './dto/token-associate.dto';
import { AccountService } from 'src/account/account.service';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { HederaTransactionApiService } from 'src/hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { Account } from 'src/account/account.entity';
import { AccountNotFoundError } from 'src/core/error';

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
