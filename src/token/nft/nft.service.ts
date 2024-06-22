import { Injectable } from '@nestjs/common';
import { User } from 'src/user/user.entity';
import { TokenCreateDto } from '../dto/token-create.dto';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { AccountService } from 'src/account/account.service';
import { HederaTransactionApiService } from 'src/hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { HederaTokenApiService } from 'src/hedera-api/hedera-token-api/hedera-token-api.service';
import { Account } from 'src/account/account.entity';
import { HederaMirrornodeApiService } from 'src/hedera-api/hedera-mirrornode-api/hedera-mirrornode-api.service';
import { AppConfigService } from 'src/config/app-config.service';
import { TokenMintDto } from '../dto/token-mint.dto';

@Injectable()
export class NftService {
  constructor(
    private keyService: KeyService,
    private clientService: ClientService,
    private accountService: AccountService,
    private tokenService: HederaTokenApiService,
    private transactionService: HederaTransactionApiService,
    private mirrornodeService: HederaMirrornodeApiService,
  ) {}

  async tokenCreateHandler(
    user: User,
    createNftDto: TokenCreateDto,
    encryptionKey?: string,
  ) {
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(user, encryptionKey);
    // get and set treasury account
    const treasuryAccount = await this.accountService.getUserAccountByAlias(
      user.id,
      createNftDto.treasuryAccountId,
    );
    createNftDto.treasuryAccountId = treasuryAccount.id;
    // handle case if payer is separate
    let payerAccount: Account;
    if (createNftDto.payerId) {
      payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        createNftDto.payerId,
      );
    }
    // build client and signers
    const { client, signers } = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      treasuryAccount,
      payerAccount,
    );
    // parse any alias ids in custom fees to account ids
    const { fixedFees, royaltyFees } =
      await this.accountService.parseCustomFeeAliases(user.id, createNftDto);
    createNftDto.fixedFees = fixedFees;
    createNftDto.royaltyFees = royaltyFees;
    // create token transaction
    const createTokenTransaction = await this.tokenService.createTransaction(
      createNftDto,
      treasuryAccount.keys[0].publicKey, // treasury account is the default key
    );
    const receipt =
      await this.transactionService.freezeSignExecuteAndGetReceipt(
        createTokenTransaction,
        client,
        signers,
      );
    return receipt.tokenId.toString();
  }

  async tokenMintHandler(
    user: User,
    tokenMintDto: TokenMintDto,
    encryptionKey?: string,
  ): Promise<string> {
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(user, encryptionKey);
    // get supply key from mirrornode
    const supplyKey = await this.mirrornodeService
      .getTokenMirrornodeInfo(user.network, tokenMintDto.tokenId)
      .then((info) => info.supply_key.key)
      .catch(() => {
        throw new Error(
          `Token ${tokenMintDto.tokenId} does not have a supply key`,
        );
      });
    // get and decrypt private keys for supply key
    const supplyAccount = await this.accountService
      .getUserAccountByPublicKey(user.id, supplyKey)
      .catch(() => {
        throw new Error('Your GoMint user does not own this supply account');
      });
    // handle case if payer is separate
    let payerAccount: Account;
    if (tokenMintDto.payerId) {
      payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        tokenMintDto.payerId,
      );
    }
    // build client and signers
    const { client, signers } = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      supplyAccount,
      payerAccount,
    );
    // create mint transaction
    const mintTransaction =
      await this.tokenService.mintNftTransaction(tokenMintDto);
    const receipt =
      await this.transactionService.freezeSignExecuteAndGetReceipt(
        mintTransaction,
        client,
        signers,
      );
    return receipt.status.toString();
  }
}
