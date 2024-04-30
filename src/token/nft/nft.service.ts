import { Injectable } from '@nestjs/common';
import { NftCreateInput, NftMintInput } from './nft.interface';
import {
  Key,
  TokenCreateTransaction,
  Client,
  TokenType,
  TokenMintTransaction,
  CustomFee,
  CustomRoyaltyFee,
  TokenId,
  PrivateKey,
  TokenSupplyType,
} from '@hashgraph/sdk';
import { User } from 'src/user/user.entity';
import { CreateNftDto, RoyaltyFee } from './dto/create-nft.dto';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { AccountService } from 'src/account/account.service';
import { TokenService } from '../token.service';
import { MintNftDto } from './dto/mint-nft.dto';
import { KeyType } from 'src/app.interface';

@Injectable()
export class NftService extends TokenService {
  constructor(
    private keyService: KeyService,
    private clientService: ClientService,
    private accountService: AccountService,
  ) {
    super();
  }

  async createToken(user: User, createNftDto: CreateNftDto) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        createNftDto.encryptionKey,
      );
    // get treasury account and keys for signing
    // TO DO
    // here, if treasuryAccountId is 0.0. type then check by account id first
    // if not found, then throw error
    // else check by alias
    // this means if a non 0.0. alias's account id is being provided, tx will still fly
    const treasuryAccount = await this.accountService
      .getUserAccountByAlias(user.id, createNftDto.treasuryAccountId)
      .catch(() => {
        throw new Error('Unable to find matching alias to treasuryAccountId');
      });

    let client: Client;
    let signingKeys: PrivateKey[] = [];
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
    if (createNftDto.payerId) {
      // get payer account and keys for signing
      const payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        createNftDto.payerId,
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
    // parse public keys
    const tokenPublicKeys = this.parsePublicKeys(
      createNftDto,
      // public keys default to the treasury account's public key
      treasuryAccount.keys[0].publicKey,
    );
    const customFees = await this.parseCustomFees(user.id, createNftDto);
    //create token
    const nftCreateInput: NftCreateInput = {
      tokenName: createNftDto.tokenName,
      tokenSymbol: createNftDto.tokenSymbol,
      maxSupply: createNftDto.maxSupply,
      treasuryAccountId: treasuryAccount.id,
      customFees,
      ...tokenPublicKeys,
    };

    return this.createTransactionAndExecute(
      nftCreateInput,
      client,
      signingKeys,
    );
  }

  private async parseCustomFees(
    userId: string,
    createNftDto: CreateNftDto,
  ): Promise<CustomFee[]> {
    const { fixedFees, royaltyFees } = createNftDto;
    if (!fixedFees && !royaltyFees) return [];
    const customFees: CustomFee[] = [];
    // set fixed fees
    if (fixedFees) {
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
    }
    // set royalty fees
    if (royaltyFees) {
      customFees.push(
        ...(await Promise.all(
          royaltyFees.map((fee) =>
            this.accountService
              .getUserAccountByAlias(userId, fee.feeCollectorAccountId)
              .then((feeCollectorAccount) =>
                this.parseRoyaltyFee(fee, feeCollectorAccount.id),
              ),
          ),
        )),
      );
    }

    return customFees;
  }

  private parseRoyaltyFee(fee: RoyaltyFee, feeCollectorAccountId: string) {
    const royaltyFee = new CustomRoyaltyFee()
      .setFeeCollectorAccountId(feeCollectorAccountId)
      .setNumerator(fee.numerator)
      .setDenominator(fee.denominator)
      .setAllCollectorsAreExempt(fee.allCollectorsAreExempt);
    if (fee.fallbackFee)
      royaltyFee.setFallbackFee(
        this.parseFixedFee(fee.fallbackFee, feeCollectorAccountId),
      );
    return royaltyFee;
  }

  async mintToken(user: User, mintNftDto: MintNftDto) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        mintNftDto.encryptionKey,
      );
    // fetch supplyKey from mirrornode
    const supplyKey = await this.getTokenMirronodeInfo(
      user.network,
      mintNftDto.tokenId,
    ).then((info) => info.supply_key.key);
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
    let signingKeys: PrivateKey[] = [];
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
    if (mintNftDto.payerId) {
      // get payer account and keys for signing
      const payerAccount = await this.accountService.getUserAccountByAlias(
        user.id,
        mintNftDto.payerId,
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
    const nftMintInput: NftMintInput = {
      tokenId: mintNftDto.tokenId,
      metadatas: mintNftDto.metadatas.length // handle both metdata formats
        ? mintNftDto.metadatas.map((metadata) => Buffer.from(metadata))
        : Array(mintNftDto.amount).fill(Buffer.from(mintNftDto.metadata)),
    };
    return this.mintTransactionAndExecute(nftMintInput, client, signingKeys);
  }

  async createTransactionAndExecute(
    nftCreateInput: NftCreateInput,
    client: Client,
    privateKeys: PrivateKey[],
  ) {
    const transaction = this.createTransaction(nftCreateInput);
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
    ftMintInput: NftMintInput,
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

  private createTransaction(nftCreateInput: NftCreateInput) {
    const transaction = new TokenCreateTransaction()
      .setTokenName(nftCreateInput.tokenName)
      .setTokenType(TokenType.NonFungibleUnique)
      .setTokenSymbol(nftCreateInput.tokenSymbol)
      .setInitialSupply(0)
      .setTreasuryAccountId(nftCreateInput.treasuryAccountId)
      .setAdminKey(nftCreateInput.adminKey)
      .setKycKey(nftCreateInput.kycKey)
      .setFreezeKey(nftCreateInput.freezeKey)
      .setWipeKey(nftCreateInput.wipeKey)
      .setSupplyKey(nftCreateInput.supplyKey)
      .setPauseKey(nftCreateInput.pauseKey)
      .setFreezeDefault(nftCreateInput.freezeDefault)
      .setExpirationTime(
        nftCreateInput.expirationTime ?? this.todayPlus90Days(),
      )
      .setFeeScheduleKey(nftCreateInput.feeScheduleKey)
      .setCustomFees(nftCreateInput.customFees ?? [])
      .setSupplyType(
        nftCreateInput.supplyType ?? nftCreateInput.maxSupply // if maxSupply is provided, supplyType is finite
          ? TokenSupplyType.Finite
          : TokenSupplyType.Infinite,
      )
      .setMaxSupply(nftCreateInput.maxSupply)
      .setTokenMemo(nftCreateInput.tokenMemo)
      .setAutoRenewAccountId(
        nftCreateInput.autoRenewAccountId ?? nftCreateInput.treasuryAccountId,
      )
      .setAutoRenewPeriod(nftCreateInput.autoRenewPeriod ?? 7890000);

    return transaction;
  }

  private mintTransaction(ftMintInput: NftMintInput) {
    return new TokenMintTransaction()
      .setTokenId(ftMintInput.tokenId)
      .setMetadata(ftMintInput.metadatas);
  }
}
