import { Injectable } from '@nestjs/common';
import { CreateDealDto } from './dto/create-deal.dto';
import { createHash, sign } from 'crypto';
import { User } from 'src/user/user.entity';
import { AccountService } from 'src/account/account.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Deal } from './deal.entity';
import { Repository } from 'typeorm';
import {
  AccountId,
  PrivateKey,
  TransactionId,
  TransferTransaction,
} from '@hashgraph/sdk';
import { KeyService } from 'src/key/key.service';

@Injectable()
export class DealService {
  constructor(
    @InjectRepository(Deal)
    private dealRepository: Repository<Deal>,
    private accountService: AccountService,
    private keyService: KeyService,
  ) {}

  async createDeal(user: User, createDealDto: CreateDealDto) {
    // check if the deal is valid
    const isValid = this.validateAmounts(
      createDealDto.hbarTransfers,
      createDealDto.ftTransfers,
    );
    if (!isValid) {
      throw new Error('HBAR or fungible token transfers do not add up to 0');
    }
    // get the user's default account
    const accounts = await this.accountService.findAccountsByUserId(user.id);
    const account = accounts[0];
    createDealDto = this.swapAccountId(createDealDto, 'default', account.id);
    // create the deal hash
    const dealJson = JSON.stringify(createDealDto);
    const dealId = createHash('sha256').update(dealJson).digest('hex');
    // save the deal
    const deal = this.dealRepository.create({
      dealId,
      dealJson,
    });

    try {
      await this.dealRepository.save(deal);
    } catch (err) {
      console.log('Error saving deal: ' + err.code);
    }

    return dealId;
  }

  async getDealBytes(
    dealId: string,
    buyerId: string,
    clientId: string | undefined,
    encryptionKey: string | undefined = undefined,
  ) {
    const deal = await this.dealRepository.findOne({
      where: { dealId },
    });
    let dealData = JSON.parse(deal.dealJson) as CreateDealDto;
    // swap the buyer's account id
    dealData = this.swapAccountId(dealData, 'buyer', buyerId);
    // create transfer transaction
    const transaction = this.transferTransaction(dealData, clientId || buyerId);
    // get required signers
    const requiredSigners = this.findRequiredSigners(dealData);
    // fetch the signers which we have in db
    const signerAccounts =
      await this.accountService.findAccountsByIds(requiredSigners);
    // decrypt the keys
    const decryptedKeys = signerAccounts.flatMap((account) => {
      let escrowKey = account.user.escrowKey;
      if (account.user.hasEncryptionKey)
        // user will need to use proxy server if they want to use their escrow key
        escrowKey = this.keyService.decryptString(escrowKey, encryptionKey);
      return account.keys.map((key) => {
        return {
          type: key.type,
          publicKey: key.publicKey,
          privateKey: this.keyService.decryptString(
            key.encryptedPrivateKey,
            escrowKey,
          ),
        };
      });
    });
    // sign the transaction
    await Promise.all(
      decryptedKeys.map(({ type, privateKey }) => {
        switch (type) {
          case 'ed25519':
            return transaction.sign(PrivateKey.fromStringED25519(privateKey));
          case 'ecdsa':
            return transaction.sign(PrivateKey.fromStringECDSA(privateKey));
          default:
            throw new Error('Invalid key type');
        }
      }),
    );
    return transaction.toBytes();
  }

  private findRequiredSigners(dto: CreateDealDto): string[] {
    const negativeBalanceAccountIds = new Set<string>();
    dto.hbarTransfers.forEach((transfer) => {
      if (transfer.amount < 0) {
        negativeBalanceAccountIds.add(transfer.accountId);
      }
    });
    dto.ftTransfers.forEach((transfer) => {
      if (transfer.amount < 0) {
        negativeBalanceAccountIds.add(transfer.accountId);
      }
    });
    dto.nftTransfers.forEach((transfer) => {
      negativeBalanceAccountIds.add(transfer.senderId);
    });
    return Array.from(negativeBalanceAccountIds);
  }

  private transferTransaction(dealData: CreateDealDto, feePayerId: string) {
    const transactionId = TransactionId.generate(feePayerId);
    const transaction = new TransferTransaction()
      .setTransactionId(transactionId)
      .setNodeAccountIds([new AccountId(3)]);
    // add hbar transfers
    dealData.hbarTransfers.forEach((transfer) => {
      transaction.addHbarTransfer(transfer.accountId, transfer.amount);
    });
    // add ft transfers
    dealData.ftTransfers.forEach((transfer) => {
      transaction.addTokenTransfer(
        transfer.tokenId,
        transfer.accountId,
        transfer.amount,
      );
    });
    // add nft transfers
    dealData.nftTransfers.forEach((transfer) => {
      transaction.addNftTransfer(
        transfer.tokenId,
        transfer.serialNumber,
        transfer.senderId,
        transfer.receiverId,
      );
    });
    return transaction.freeze();
  }

  private swapAccountId(
    dto: CreateDealDto,
    alias: 'default' | 'buyer',
    newAccountId: string,
  ): CreateDealDto {
    dto.hbarTransfers.forEach((transfer) => {
      if (transfer.accountId === alias) {
        transfer.accountId = newAccountId;
      }
    });

    dto.ftTransfers.forEach((transfer) => {
      if (transfer.accountId === alias) {
        transfer.accountId = newAccountId;
      }
    });

    dto.nftTransfers.forEach((transfer) => {
      if (transfer.senderId === alias) {
        transfer.senderId = newAccountId;
      }
    });

    return dto;
  }

  private validateAmounts(
    hbarTransfers: CreateDealDto['hbarTransfers'],
    ftTransfers: CreateDealDto['ftTransfers'],
  ): boolean {
    // Check if the sum of amounts in hbarTransfers is 0
    const hbarTotal = hbarTransfers.reduce(
      (sum, transfer) => sum + transfer.amount,
      0,
    );
    // Group ftTransfers by tokenId and check if the sum of amounts for each tokenId is 0
    const ftTotals = ftTransfers.reduce((acc, transfer) => {
      acc[transfer.tokenId] = (acc[transfer.tokenId] || 0) + transfer.amount;
      return acc;
    }, {});
    const ftTotalsAllZero = Object.values(ftTotals).every(
      (amount) => amount === 0,
    );
    return hbarTotal === 0 && ftTotalsAllZero;
  }
}
