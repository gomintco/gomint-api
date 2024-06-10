import { Injectable } from '@nestjs/common';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { User } from 'src/user/user.entity';
import { AccountService } from 'src/account/account.service';
import { AppConfigService } from 'src/config/app-config.service';
import { HederaTransactionApiService } from 'src/hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { HederaTokenApiService } from 'src/hedera-api/hedera-token-api/hedera-token-api.service';
import { Account } from 'src/account/account.entity';
import { HederaMirrornodeApiService } from 'src/hedera-api/hedera-mirrornode-api/hedera-mirrornode-api.service';
import { TokenCreateDto } from '../dto/token-create.dto';
import { TokenMintDto } from '../dto/token-mint.dto';

@Injectable()
export class FtService {
  constructor(
    private readonly keyService: KeyService,
    private readonly clientService: ClientService,
    private readonly accountService: AccountService,
    private readonly configService: AppConfigService,
    private readonly tokenService: HederaTokenApiService,
    private readonly hederaTransactionApiService: HederaTransactionApiService,
    private readonly hederaMirrornodeApiService: HederaMirrornodeApiService,
  ) { }

  async tokenCreateHandler(user: User, tokenCreateDto: TokenCreateDto) {
    console.log('user', user);
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      tokenCreateDto.encryptionKey,
    );

    // get and set treasury account
    const treasuryAccount = await this.accountService
      .getUserAccountByAlias(user.id, tokenCreateDto.treasuryAccountId)
      .catch(() => { // should handle this inside the .getUserByAccountAlias function
        throw new Error('No accounts with alias: ' + tokenCreateDto.treasuryAccountId);
      });
    tokenCreateDto.treasuryAccountId = treasuryAccount.id;
    // handle case if payer is separate
    let payerAccount: Account;
    if (tokenCreateDto.payerId)
      payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        tokenCreateDto.payerId,
      );
    // build client and signers
    const { client, signers } = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      treasuryAccount,
      payerAccount,
    );
    // parse any alias ids in custom fees to account ids
    const { fixedFees, fractionalFees } =
      await this.accountService.parseCustomFeeAliases(user.id, tokenCreateDto);
    tokenCreateDto.fixedFees = fixedFees;
    tokenCreateDto.fractionalFees = fractionalFees;
    // create token transaction
    const createTokenTransaction = this.tokenService.createTransaction(
      tokenCreateDto,
      treasuryAccount.keys[0].publicKey, // treasury account is the default key
    );
    const receipt =
      await this.hederaTransactionApiService.freezeSignExecuteAndGetReceipt(
        createTokenTransaction,
        client,
        signers,
      );
    return receipt.tokenId.toString();
  }

  async tokenMintHandler(user: User, tokenMintDto: TokenMintDto): Promise<string> {
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      tokenMintDto.encryptionKey,
    );
    // get supply key from mirrornode
    const supplyKey = await this.hederaMirrornodeApiService
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
    if (tokenMintDto.payerId)
      payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        tokenMintDto.payerId,
      );
    // build client and signers
    const { client, signers } = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      supplyAccount,
      payerAccount,
    );
    // create mint transaction
    const mintTransaction = this.tokenService.mintFtTransaction(tokenMintDto);
    const receipt =
      await this.hederaTransactionApiService.freezeSignExecuteAndGetReceipt(
        mintTransaction,
        client,
        signers,
      );
    return receipt.status.toString();
  }
}
