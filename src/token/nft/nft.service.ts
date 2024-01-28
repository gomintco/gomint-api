import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { NftCreateInput } from './nft.interface';
import { Key, TokenCreateTransaction, Client, TokenType } from '@hashgraph/sdk';
import { User } from 'src/user/user.entity';
import { CreateNftDto } from './dto/create-nft.dto';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { AccountService } from 'src/account/account.service';
import { TokenService } from '../token.service';
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
    // get account and keys from user
    const accounts = await this.accountService.findAccountsByUserId(user.id);
    // only support one account for now
    const account = accounts[0];
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        createNftDto.encryptionKey,
      );
    // decrypt keys
    const decryptedKeys = account.keys.map((key) =>
      this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
    );
    const tokenPublicKeys = this.parsePublicKeys(
      createNftDto,
      account.keys[0].publicKey,
    );
    //create token
    const nftCreateInput: NftCreateInput = {
      tokenName: createNftDto.tokenName,
      tokenSymbol: createNftDto.tokenSymbol,
      treasuryAccountId: createNftDto.treasuryAccountId ?? account.id,
      ...tokenPublicKeys,
    };
    return this.createTransactionAndExecute(
      nftCreateInput,
      this.clientService.buildClient(
        user.network,
        account.id,
        decryptedKeys[0], // client with multikey?? -> investiage further
        // cant have a multikey client... each user will need to have a client account with only one key...
      ),
    );
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
}
