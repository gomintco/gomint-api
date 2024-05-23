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
import { MintNftDto } from './dto/mint-nft.dto';
import { KeyType } from 'src/app.interface';
import { TransactionService } from 'src/hedera/transaction/transaction.service';
import { TokenService } from 'src/hedera/token/token.service';
import { Account } from 'src/account/account.entity';
import { MirrornodeService } from 'src/hedera/mirrornode/mirrornode.service';

@Injectable()
export class NftService {
  constructor(
    private keyService: KeyService,
    private clientService: ClientService,
    private accountService: AccountService,
    private tokenService: TokenService,
    private transactionService: TransactionService,
    private mirrornodeService: MirrornodeService,
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

  async mintToken(user: User, mintNftDto: MintNftDto) {
    let escrowKey = user.escrowKey;
    if (user.hasEncryptionKey)
      escrowKey = this.keyService.decryptString(
        user.escrowKey,
        mintNftDto.encryptionKey,
      );
    // fetch supplyKey from mirrornode
    const supplyKey = await this.mirrornodeService
      .getTokenMirronodeInfo(user.network, mintNftDto.tokenId)
      .then((info) => info.supply_key.key);
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

  private mintTransaction(ftMintInput: NftMintInput) {
    return new TokenMintTransaction()
      .setTokenId(ftMintInput.tokenId)
      .setMetadata(ftMintInput.metadatas);
  }
}
