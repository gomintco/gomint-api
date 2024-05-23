import { BadRequestException, Injectable } from '@nestjs/common';

import { FtCreateInput, FtMintInput } from './ft.interface';
import {
  Key,
  TokenCreateTransaction,
  Client,
  TokenSupplyType,
  TokenMintTransaction,
  CustomFee,
  CustomFixedFee,
  Hbar,
  CustomFractionalFee,
  FeeAssessmentMethod,
  PrivateKey,
  TokenType,
} from '@hashgraph/sdk';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { User } from 'src/user/user.entity';
import { CreateFtDto, FractionalFee } from 'src/token/ft/dto/create-ft.dto';
import { AccountService } from 'src/account/account.service';
// import { TokenService } from 'src/token/token.service';
import { MintFtDto } from './dto/mint-ft.dto';
import { KeyType } from 'src/app.interface';
import { TransactionService } from 'src/hedera/transaction/transaction.service';
import { TokenService } from 'src/hedera/token/token.service';
import { Account } from 'src/account/account.entity';
import { MirrornodeService } from 'src/hedera/mirrornode/mirrornode.service';

@Injectable()
export class FtService {
  constructor(
    private keyService: KeyService,
    private clientService: ClientService,
    private accountService: AccountService,
    private tokenService: TokenService,
    private transactionService: TransactionService,
    private mirrornodeService: MirrornodeService,
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

  async mintTokenHandler(user: User, mintFtDto: MintFtDto) {
    // get required accounts, keys, and clients
    const escrowKey = this.keyService.decryptUserEscrowKey(
      user,
      mintFtDto.encryptionKey,
    );
    // get supply key from mirrornode
    const supplyKey = await this.mirrornodeService
      .getTokenMirronodeInfo(user.network, mintFtDto.tokenId)
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
    const mintTransaction = this.tokenService.mintTransaction(mintFtDto);
    const receipt =
      await this.transactionService.freezeSignExecuteAndGetReceipt(
        mintTransaction,
        client,
        signers,
      );
    return receipt.status.toString();
  }
}
