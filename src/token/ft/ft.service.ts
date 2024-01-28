import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { FtCreateInput } from './ft.interface';
import { Key, TokenCreateTransaction, Client } from '@hashgraph/sdk';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { User } from 'src/user/user.entity';
import { CreateFtDto } from 'src/token/ft/dto/create-ft.dto';
import { AccountService } from 'src/account/account.service';
import { TokenService } from 'src/token/token.service';

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
    // get account and keys from user
    const accounts = await this.accountService.findAccountsByUserId(user.id);
    // only support one account for now
    const account = accounts[0];
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        createFtDto.encryptionKey,
      );
    // decrypt keys
    const decryptedKeys = account.keys.map((key) =>
      this.keyService.decryptString(key.encryptedPrivateKey, escrowKey),
    );
    const tokenPublicKeys = this.parsePublicKeys(
      createFtDto,
      account.keys[0].publicKey,
    );
    // create token
    const ftCreateInput: FtCreateInput = {
      tokenName: createFtDto.tokenName,
      tokenSymbol: createFtDto.tokenSymbol,
      treasuryAccountId: createFtDto.treasuryAccountId ?? account.id,
      decimals: createFtDto.decimals ?? 0,
      initialSupply: createFtDto.initialSupply ?? 0,
      ...tokenPublicKeys,
    };

    return this.createTransactionAndExecute(
      ftCreateInput,
      this.clientService.buildClient(
        user.network,
        account.id,
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
}
