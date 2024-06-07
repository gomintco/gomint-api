import { Injectable }  from '@nestjs/common';
import { TokenType } from '@hashgraph/sdk';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { User } from 'src/user/user.entity';
import { CreateFtDto } from 'src/token/ft/dto/create-ft.dto';
import { AccountService } from 'src/account/account.service';
import { MintFtDto } from './dto/mint-ft.dto';
import { AppConfigService } from 'src/config/app-config.service';
import { HederaTransactionApiService } from 'src/hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { HederaTokenApiService } from 'src/hedera-api/hedera-token-api/hedera-token-api.service';
import { Account } from 'src/account/account.entity';
import { HederaMirrornodeApiService } from 'src/hedera-api/hedera-mirrornode-api/hedera-mirrornode-api.service';

@Injectable()
export class FtService {
  constructor(
    private readonly keyService: KeyService,
    private readonly clientService: ClientService,
    private readonly accountService: AccountService,
    private readonly configService: AppConfigService,
    private readonly tokenService: HederaTokenApiService,
    private readonly transactionService: HederaTransactionApiService,
    private readonly mirrornodeService: HederaMirrornodeApiService,
  ) {}

  async createTokenHandler(user: User, createFtDto: CreateFtDto) {
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      createFtDto.encryptionKey,
    );
    // get and set treasury account
    const treasuryAccount = await this.accountService.getUserAccountByAlias(
      user.id,
      createFtDto.treasuryAccountId,
    );
    createFtDto.treasuryAccountId = treasuryAccount.id;
    // handle case if payer is separate
    let payerAccount: Account;
    if (createFtDto.payerId)
      payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        createFtDto.payerId,
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
      await this.accountService.parseCustomFeeAliases(user.id, createFtDto);
    createFtDto.fixedFees = fixedFees;
    createFtDto.fractionalFees = fractionalFees;
    // create token transaction
    const createTokenTransaction = this.tokenService.createTransaction(
      createFtDto,
      TokenType.FungibleCommon,
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

  async mintTokenHandler(user: User, mintFtDto: MintFtDto): Promise<string> {
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      mintFtDto.encryptionKey,
    );
    // get supply key from mirrornode
    const supplyKey = await this.mirrornodeService
      .getTokenMirrornodeInfo(user.network, mintFtDto.tokenId)
      .then((info) => info.supply_key.key)
      .catch(() => {
        throw new Error(
          `Token ${mintFtDto.tokenId} does not have a supply key`,
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
    if (mintFtDto.payerId)
      payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        mintFtDto.payerId,
      );
    // build client and signers
    const { client, signers } = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      supplyAccount,
      payerAccount,
    );
    // create mint transaction
    const mintTransaction = this.tokenService.mintFtTransaction(mintFtDto);
    const receipt =
      await this.transactionService.freezeSignExecuteAndGetReceipt(
        mintTransaction,
        client,
        signers,
      );
    return receipt.status.toString();
  }
}
