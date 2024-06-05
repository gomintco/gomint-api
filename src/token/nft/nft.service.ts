import { Injectable } from '@nestjs/common';
import { TokenType } from '@hashgraph/sdk';
import { User } from 'src/user/user.entity';
import { CreateNftDto } from './dto/create-nft.dto';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { AccountService } from 'src/account/account.service';
import { MintNftDto } from './dto/mint-nft.dto';
import { TransactionService } from 'src/hedera/transaction/transaction.service';
import { TokenService } from 'src/hedera/token/token.service';
import { Account } from 'src/account/account.entity';
import { MirrornodeService } from 'src/hedera/mirrornode/mirrornode.service';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class NftService {
  constructor(
    private keyService: KeyService,
    private clientService: ClientService,
    private accountService: AccountService,
    private tokenService: TokenService,
    private transactionService: TransactionService,
    private mirrornodeService: MirrornodeService,
    private readonly configService: AppConfigService,
  ) {}

  async createTokenHandler(user: User, createNftDto: CreateNftDto) {
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      createNftDto.encryptionKey,
    );
    // get and set treasury account
    const treasuryAccount = await this.accountService.getUserAccountByAlias(
      user.id,
      createNftDto.treasuryAccountId,
    );
    createNftDto.treasuryAccountId = treasuryAccount.id;
    // handle case if payer is separate
    let payerAccount: Account;
    if (createNftDto.payerId)
      payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        createNftDto.payerId,
      );
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
    const createTokenTransaction = this.tokenService.createTransaction(
      createNftDto,
      TokenType.NonFungibleUnique,
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

  async mintTokenHandler(user: User, mintNftDto: MintNftDto): Promise<string> {
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      mintNftDto.encryptionKey,
    );
    // get supply key from mirrornode
    const supplyKey = await this.mirrornodeService
      .getTokenMirrornodeInfo(user.network, mintNftDto.tokenId)
      .then((info) => info.supply_key.key)
      .catch(() => {
        throw new Error(
          `Token ${mintNftDto.tokenId} does not have a supply key`,
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
    if (mintNftDto.payerId)
      payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        mintNftDto.payerId,
      );
    // build client and signers
    const { client, signers } = this.clientService.buildClientAndSigningKeys(
      user.network,
      escrowKey,
      supplyAccount,
      payerAccount,
    );
    // create mint transaction
    const mintTransaction = this.tokenService.mintNftTransaction(mintNftDto);
    const receipt =
      await this.transactionService.freezeSignExecuteAndGetReceipt(
        mintTransaction,
        client,
        signers,
      );
    return receipt.status.toString();
  }
}
