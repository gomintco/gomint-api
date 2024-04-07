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
} from '@hashgraph/sdk';
import { User } from 'src/user/user.entity';
import { CreateNftDto, RoyaltyFee } from './dto/create-nft.dto';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { AccountService } from 'src/account/account.service';
import { TokenService } from '../token.service';
import { MintNftDto } from './dto/mint-nft.dto';
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
    const treasuryAccount = await this.accountService.getUserAccountByAlias(
      user.id,
      createNftDto.treasuryAccountId,
    );

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
    // decrypt keys
    const decryptedKeys = treasuryAccount.keys.map((key) =>
      this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
    );
    return this.createTransactionAndExecute(
      nftCreateInput,
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
    // const { account, decryptedKeys } =
    //   await this.getDefaultAccountAndDecryptKeys(
    //     user,
    //     user.hasEncryptionKey,
    //     mintNftDto.encryptionKey,
    //   );
    // const nftMintInput: NftMintInput = {
    //   tokenId: mintNftDto.tokenId,
    //   metadatas: mintNftDto.metadatas.length // handle both metdata formats
    //     ? mintNftDto.metadatas.map((metadata) => Buffer.from(metadata))
    //     : Array(mintNftDto.amount).fill(Buffer.from(mintNftDto.metadata)),
    // };
    // // if supply key is not default, will need to find the private key
    // // decrypt it, and use it to sign the transaction
    // // therefore will need to built tx and execute after
    // // it should be in the decruptedKeys array
    // return this.mintTransactionAndExecute(
    //   nftMintInput,
    //   this.clientService.buildClient(
    //     user.network,
    //     account.id,
    //     decryptedKeys[0],
    //   ),
    // );
  }

  async createTransactionAndExecute(
    nftCreateInput: NftCreateInput,
    client: Client,
  ) {
    const transaction = this.createTransaction(nftCreateInput);
    transaction.freezeWith(client);

    //   const keysToSignWith = this.uniqueKeys(ftCreateInput);
    // here we need all private keys for the respective public keys
    // await Promise.all([...keysToSignWith].map(key => transaction.sign(key)));
    // lets leave for now...
    const submit = await transaction.execute(client);
    const receipt = await submit.getReceipt(client);
    return receipt.tokenId.toString();
  }

  async mintTransactionAndExecute(ftMintInput: NftMintInput, client: Client) {
    const transaction = this.mintTransaction(ftMintInput);
    transaction.freezeWith(client);
    const submit = await transaction.execute(client);
    const receipt = await submit.getReceipt(client);
    return receipt.status.toString();
  }

  private createTransaction(ftCreateInput: NftCreateInput) {
    const transaction = new TokenCreateTransaction()
      .setTokenName(ftCreateInput.tokenName)
      .setTokenType(TokenType.NonFungibleUnique)
      .setTokenSymbol(ftCreateInput.tokenSymbol)
      .setInitialSupply(0)
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

  private mintTransaction(ftMintInput: NftMintInput) {
    return new TokenMintTransaction()
      .setTokenId(ftMintInput.tokenId)
      .setMetadata(ftMintInput.metadatas);
  }

  // private getDefaultAccountAndDecryptKeys = async (
  //   user: User,
  //   userHasEncryptionKey: boolean,
  //   encryptionKey: string,
  // ) => {
  //   // get account and keys from user
  //   const accounts = await this.accountService.findAccountsByUserId(user.id);
  //   // only support one account for now
  //   const account = accounts[0];
  //   let escrowKey = user.escrowKey;
  //   if (userHasEncryptionKey)
  //     escrowKey = this.keyService.decryptString(user.escrowKey, encryptionKey);
  //   // decrypt keys
  //   const decryptedKeys = account.keys.map((key) =>
  //     this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
  //   );

  //   return { account, decryptedKeys };
  // };
}
