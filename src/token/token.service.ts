import { Injectable } from '@nestjs/common';
import { HederaMirrornodeApiService } from 'src/hedera-api/hedera-mirrornode-api/hedera-mirrornode-api.service';
import { HederaTokenApiService } from 'src/hedera-api/hedera-token-api/hedera-token-api.service';
import { User } from 'src/user/user.entity';
import { TokenAssociateDto } from './dto/token-associate.dto';
import { AccountService } from 'src/account/account.service';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { HederaTransactionApiService } from 'src/hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { Account } from 'src/account/account.entity';

@Injectable()
export class TokenService {
  constructor(
    private readonly hederaTokenApiService: HederaTokenApiService,
    private readonly hederaMirrornodeApiService: HederaMirrornodeApiService,
    private readonly accountService: AccountService,
    private readonly keyService: KeyService,
    private readonly clientService: ClientService,
    private readonly hederaTransactionApiService: HederaTransactionApiService,
  ) {}

  async tokenAssociateHandler(
    user: User,
    tokenAssociateDto: TokenAssociateDto,
  ) {
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      tokenAssociateDto.encryptionKey,
    );
    const associatingAccount = await this.accountService
      .getUserAccountByAlias(user.id, tokenAssociateDto.associatingId)
      .catch(() => {
        throw new Error(
          'Unable to find account with associatingId: ' +
            tokenAssociateDto.associatingId,
        );
      });
    tokenAssociateDto.associatingId = associatingAccount.id;
    // handle case if payerId is separate
    let payerAccount: Account;
    if (tokenAssociateDto.payerId)
      payerAccount = await this.accountService
        .getUserAccountByAlias(user.id, tokenAssociateDto.payerId)
        .catch(() => {
          throw new Error(
            'Unable to find account with payerId: ' + tokenAssociateDto.payerId,
          );
        });
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
