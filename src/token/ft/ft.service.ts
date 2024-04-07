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
} from '@hashgraph/sdk';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { User } from 'src/user/user.entity';
import { CreateFtDto, FractionalFee } from 'src/token/ft/dto/create-ft.dto';
import { AccountService } from 'src/account/account.service';
import { TokenService } from 'src/token/token.service';
import { MintFtDto } from './dto/mint-ft.dto';

@Injectable()
export class FtService extends TokenService {
  constructor(
    private keyService: KeyService,
    private clientService: ClientService,
    private accountService: AccountService,
  ) {
    super();
  }

  async createToken(user: User, createFtDto: CreateFtDto) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        createFtDto.encryptionKey,
      );
    // get treasury account and keys for signing
    const treasuryAccount = await this.accountService.getUserAccountByAlias(
      user.id,
      createFtDto.treasuryAccountId,
    );
    const tokenPublicKeys = this.parsePublicKeys(
      createFtDto,
      treasuryAccount.keys[0].publicKey,
    );
    const customFees = await this.parseCustomFees(user.id, createFtDto);
    // create token
    const ftCreateInput: FtCreateInput = {
      tokenName: createFtDto.tokenName,
      tokenSymbol: createFtDto.tokenSymbol,
      treasuryAccountId: treasuryAccount.id,
      decimals: createFtDto.decimals ?? 0,
      initialSupply: createFtDto.initialSupply ?? 0,
      maxSupply: createFtDto.maxSupply,
      supplyType: createFtDto.finite
        ? TokenSupplyType.Finite
        : TokenSupplyType.Infinite,
      customFees,
      ...tokenPublicKeys,
    };
    // decrypt keys
    const decryptedKeys = treasuryAccount.keys.map((key) =>
      this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
    );
    return this.createTransactionAndExecute(
      ftCreateInput,
      this.clientService.buildClient(
        user.network,
        treasuryAccount.id,
        decryptedKeys[0], // client with multikey?? -> investiage further
        // cant have a multikey client... each user will need to have a client account with only one key...
      ),
    );
  }

  private async parseCustomFees(
    userId: string,
    createFtDto: CreateFtDto,
  ): Promise<CustomFee[]> {
    const { fixedFees, fractionalFees } = createFtDto;
    if (!fixedFees && !fractionalFees) return [];
    const customFees: CustomFee[] = [];
    // set fixed fees
    if (fixedFees)
      customFees.push(
        ...(await Promise.all(
          fixedFees.map((fee) =>
            this.accountService
              .getUserAccountByAlias(userId, fee.feeCollectorAccountId)
              .then((feeCollectorAccount) =>
                this.parseFixedFee(fee, feeCollectorAccount.id),
              ),
          ),
        )),
      );

    // set fractional fees
    if (fractionalFees)
      customFees.push(
        ...(await Promise.all(
          fractionalFees.map((fee) =>
            this.accountService
              .getUserAccountByAlias(userId, fee.feeCollectorAccountId)
              .then((feeCollectorAccount) =>
                this.parseFractionalFee(fee, feeCollectorAccount.id),
              ),
          ),
        )),
      );
    return customFees;
  }

  private parseFractionalFee(
    fee: FractionalFee,
    feeCollectorAccountId: string,
  ) {
    return new CustomFractionalFee()
      .setFeeCollectorAccountId(feeCollectorAccountId)
      .setNumerator(fee.numerator)
      .setDenominator(fee.denominator)
      .setMax(fee.max)
      .setMin(fee.min)
      .setAssessmentMethod(new FeeAssessmentMethod(fee.senderPaysFees)) // prob need to fall back on false here
      .setAllCollectorsAreExempt(fee.allCollectorsAreExempt);
  }

  async mintToken(user: User, mintFtDto: MintFtDto) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        mintFtDto.encryptionKey,
      );
    // fetch supplyKey from mirrornode
    const supplyKey = await this.getTokenMirronodeInfo(
      user.network,
      mintFtDto.tokenId,
    )
      .then((info) => info.supply_key.key)
      .catch(() => {
        throw new Error(
          `Token ${mintFtDto.tokenId} does not have a supply key`,
        );
      });
    // get and decrypt private keys for supply key
    const supplyAccount = await this.accountService.getUserAccountByPublicKey(
      user.id,
      supplyKey,
    );
    if (!supplyAccount)
      // could probaly throw error in typeorm function
      throw new Error('Your GoMint user does not own this supply account');
    // decrypt keys
    const decryptedKeys = supplyAccount.keys.map((key) =>
      this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
    );
    const ftMintInput: FtMintInput = {
      tokenId: mintFtDto.tokenId,
      amount: mintFtDto.amount,
    };
    return this.mintTransactionAndExecute(
      ftMintInput,
      this.clientService.buildClient(
        user.network,
        supplyAccount.id,
        decryptedKeys[0], // client with multikey?? -> investiage further
        // cant have a multikey client... each user will need to have a client account with only one key...
      ),
    );
  }

  async createTransactionAndExecute(
    ftCreateInput: FtCreateInput,
    client: Client,
  ) {
    const transaction = this.createTransaction(ftCreateInput);
    transaction.freezeWith(client);
    //   const keysToSignWith = this.uniqueKeys(ftCreateInput);
    // here we need all private keys for the respective public keys
    // await Promise.all([...keysToSignWith].map(key => transaction.sign(key)));
    // lets leave for now...
    const submit = await transaction.execute(client);
    const receipt = await submit.getReceipt(client);
    return receipt.tokenId.toString();
  }

  async mintTransactionAndExecute(ftMintInput: FtMintInput, client: Client) {
    const transaction = this.mintTransaction(ftMintInput);
    transaction.freezeWith(client);
    const submit = await transaction.execute(client);
    const receipt = await submit.getReceipt(client);
    return receipt.status.toString();
  }

  private createTransaction(ftCreateInput: FtCreateInput) {
    const transaction = new TokenCreateTransaction()
      .setTokenName(ftCreateInput.tokenName)
      .setTokenSymbol(ftCreateInput.tokenSymbol)
      .setDecimals(ftCreateInput.decimals)
      .setInitialSupply(ftCreateInput.initialSupply)
      .setTreasuryAccountId(ftCreateInput.treasuryAccountId)
      .setAdminKey(ftCreateInput.adminKey)
      .setKycKey(ftCreateInput.kycKey)
      .setFreezeKey(ftCreateInput.freezeKey)
      .setWipeKey(ftCreateInput.wipeKey)
      .setSupplyKey(ftCreateInput.supplyKey)
      .setPauseKey(ftCreateInput.pauseKey)
      .setFreezeDefault(ftCreateInput.freezeDefault)
      .setExpirationTime(ftCreateInput.expirationTime ?? this.todayPlus90Days())
      .setFeeScheduleKey(ftCreateInput.feeScheduleKey)
      .setCustomFees(ftCreateInput.customFees ?? [])
      .setSupplyType(ftCreateInput.supplyType)
      .setMaxSupply(ftCreateInput.maxSupply)
      .setTokenMemo(ftCreateInput.tokenMemo)
      .setAutoRenewAccountId(
        ftCreateInput.autoRenewAccountId ?? ftCreateInput.treasuryAccountId,
      )
      .setAutoRenewPeriod(ftCreateInput.autoRenewPeriod ?? 7890000);

    return transaction;
  }

  private mintTransaction(ftMintInput: FtMintInput) {
    return new TokenMintTransaction()
      .setTokenId(ftMintInput.tokenId)
      .setAmount(ftMintInput.amount);
  }
}
