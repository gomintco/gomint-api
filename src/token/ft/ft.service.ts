import { Injectable } from '@nestjs/common';
import { FtCreateInput, FtMintInput } from './ft.interface';
import {
  TokenCreateTransaction,
  Client,
  TokenSupplyType,
  TokenMintTransaction,
  CustomFee,
  CustomFractionalFee,
  FeeAssessmentMethod,
  PrivateKey,
} from '@hashgraph/sdk';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { User } from 'src/user/user.entity';
import { CreateFtDto, FractionalFee } from 'src/token/ft/dto/create-ft.dto';
import { AccountService } from 'src/account/account.service';
import { TokenService } from 'src/token/token.service';
import { MintFtDto } from './dto/mint-ft.dto';
import { KeyType } from 'src/app.interface';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class FtService extends TokenService {
  constructor(
    private readonly keyService: KeyService,
    private readonly clientService: ClientService,
    private readonly accountService: AccountService,
    protected readonly configService: AppConfigService,
  ) {
    super(configService);
  }

  async createToken(user: User, createFtDto: CreateFtDto) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        createFtDto.encryptionKey,
      );
    // get treasury account and keys for signing
    const treasuryAccount = await this.accountService
      .getUserAccountByAlias(user.id, createFtDto.treasuryAccountId)
      .catch(() => {
        throw new Error('Unable to find matching alias to treasuryAccountId');
      });

    let client: Client;
    const signingKeys: PrivateKey[] = [];
    // decrypt treasury keys
    const decryptedTreasuryKeys = treasuryAccount.keys.map((key) => {
      const decryptedKey = this.keyService.decryptString(
        key.encryptedPrivateKey,
        escrowKey,
      );
      // return as PrivateKey type
      switch (key.type) {
        case KeyType.ED25519:
          return PrivateKey.fromStringED25519(decryptedKey);
        case KeyType.ECDSA:
          return PrivateKey.fromStringECDSA(decryptedKey);
        default:
          throw new Error('Invalid key type in treasury account');
      }
    });
    // handle logic for payer other than treasury account
    if (createFtDto.payerId) {
      // get payer account and keys for signing
      const payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        createFtDto.payerId,
      );
      const decryptedPayerKeys = payerAccount.keys.map((key) =>
        this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
      );
      client = this.clientService.buildClient(
        user.network,
        payerAccount.id,
        decryptedPayerKeys[0],
      );
      // add treasury account keys for signing
      signingKeys.push(decryptedTreasuryKeys[0]);
    } else {
      client = this.clientService.buildClient(
        user.network,
        treasuryAccount.id,
        decryptedTreasuryKeys[0],
      );
    }
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
    return this.createTransactionAndExecute(ftCreateInput, client, signingKeys);
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
    const supplyKey = await this.getTokenMirrornodeInfo(
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
    // configure correct client
    let client: Client;
    const signingKeys: PrivateKey[] = [];
    // decrypt supply keys
    const decryptedSupplyKeys = supplyAccount.keys.map((key) => {
      const decryptedKey = this.keyService.decryptString(
        key.encryptedPrivateKey,
        escrowKey,
      );
      // return as PrivateKey type
      switch (key.type) {
        case KeyType.ED25519:
          return PrivateKey.fromStringED25519(decryptedKey);
        case KeyType.ECDSA:
          return PrivateKey.fromStringECDSA(decryptedKey);
        default:
          throw new Error('Invalid key type in supply account');
      }
    });
    // handle logic for payer other than supply account
    if (mintFtDto.payerId) {
      // get payer account and keys for signing
      const payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        mintFtDto.payerId,
      );
      const decryptedPayerKeys = payerAccount.keys.map((key) =>
        this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
      );
      client = this.clientService.buildClient(
        user.network,
        payerAccount.id,
        decryptedPayerKeys[0],
      );
      // add supply account keys for signing
      signingKeys.push(decryptedSupplyKeys[0]);
    } else {
      client = this.clientService.buildClient(
        user.network,
        supplyAccount.id,
        decryptedSupplyKeys[0],
      );
    }
    const ftMintInput: FtMintInput = {
      tokenId: mintFtDto.tokenId,
      amount: mintFtDto.amount,
    };
    return this.mintTransactionAndExecute(ftMintInput, client, signingKeys);
  }

  async createTransactionAndExecute(
    ftCreateInput: FtCreateInput,
    client: Client,
    privateKeys: PrivateKey[],
  ) {
    const transaction = this.createTransaction(ftCreateInput);
    transaction.freezeWith(client);

    if (privateKeys.length)
      await Promise.all(privateKeys.map((key) => transaction.sign(key)));

    //   const keysToSignWith = this.uniqueKeys(ftCreateInput);
    // here we need all private keys for the respective public keys
    // await Promise.all([...keysToSignWith].map(key => transaction.sign(key)));
    // lets leave for now...
    const submit = await transaction.execute(client);
    const receipt = await submit.getReceipt(client);
    return receipt.tokenId.toString();
  }

  async mintTransactionAndExecute(
    ftMintInput: FtMintInput,
    client: Client,
    privateKeys: PrivateKey[],
  ) {
    const transaction = this.mintTransaction(ftMintInput);
    transaction.freezeWith(client);
    if (privateKeys.length)
      await Promise.all(privateKeys.map((key) => transaction.sign(key)));
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
      .setSupplyType(
        ftCreateInput.supplyType ?? ftCreateInput.maxSupply // if maxSupply is provided, supplyType is finite
          ? TokenSupplyType.Finite
          : TokenSupplyType.Infinite,
      )
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
