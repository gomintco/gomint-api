import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateDealDto } from './dto/create-deal.dto';
import { createHash } from 'crypto';
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
import { DealAlias, Network } from 'src/app.interface';
import { MAINNET_MIRRONODE_URL, TESTNET_MIRRONODE_URL } from 'src/app.config';

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
    // swap aliases with account ids
    createDealDto = await this.swapAliasForAccountId(
      createDealDto,
      user.id,
    ).catch((err) => {
      console.error('Error swapping aliases for account ids: ' + err.message);
      throw new Error(
        'Error swapping aliases for account ids. Ensure all aliases are valid',
      );
    });
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
    network: Network,
    dealId: string,
    receiverId: string,
    payerId: string | undefined = undefined,
    serialNumber: number | undefined = undefined,
    encryptionKey: string | undefined = undefined,
  ) {
    const deal = await this.dealRepository
      .findOneOrFail({
        where: { dealId },
      })
      .catch((err) => {
        console.error('Error fetching deal: ' + err.message);
        throw new BadRequestException('Unable to find deal', {
          description: "The dealId doesn't exist or is invalid",
        });
      });

    let dealData = JSON.parse(deal.dealJson) as CreateDealDto;

    // swap the receiver's account id
    dealData = this.swapAccountId(dealData, DealAlias.RECEIVER, receiverId);
    dealData = this.swapAccountId(
      dealData,
      DealAlias.PAYER,
      payerId || receiverId,
    );
    // inject the serial number
    dealData = await this.injectNftSerialNumber(
      network,
      dealData,
      serialNumber,
    );
    // create transfer transaction
    const transaction = this.transferTransaction(
      dealData,
      payerId || receiverId,
    );
    // get required signers
    const requiredSigners = this.findRequiredSigners(dealData);
    // fetch the signers which we have in db
    const signerAccounts =
      await this.accountService.findAccountsByIds(requiredSigners);
    // decrypt the keys
    const decryptedKeys = signerAccounts.flatMap((account) => {
      let escrowKey = account.user.escrowKey;
      if (account.user.hasEncryptionKey) {
        if (!encryptionKey)
          // user will need to use proxy server if they want to use their escrow key
          throw new BadRequestException(
            'You must provide your encryption key using the POST method',
            {
              description: 'No encryption key provided',
            },
          );
        escrowKey = this.keyService.decryptString(escrowKey, encryptionKey);
      }
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
      .setNodeAccountIds([
        new AccountId(3),
        // new AccountId(4),
        // new AccountId(8),
      ]);

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

  private async swapAliasForAccountId(
    dto: CreateDealDto,
    userId: string,
  ): Promise<CreateDealDto> {
    // Helper function to determine if the account should be swapped
    const shouldSwap = (accountId: string) =>
      accountId !== 'receiver' &&
      accountId !== 'payer' &&
      !accountId.startsWith('0.0.'); // if already in account id format, no need to swap

    // Create an array to hold all the promises for parallel processing
    const promises = [];

    // Process hbarTransfers
    dto.hbarTransfers.forEach((transfer) => {
      if (shouldSwap(transfer.accountId)) {
        const promise = this.accountService
          .getUserAccountIdByAlias(userId, transfer.accountId)
          .then((newAccountId) => {
            transfer.accountId = newAccountId;
          });
        promises.push(promise);
      }
    });

    // Process ftTransfers
    dto.ftTransfers.forEach((transfer) => {
      if (shouldSwap(transfer.accountId)) {
        const promise = this.accountService
          .getUserAccountIdByAlias(userId, transfer.accountId)
          .then((newAccountId) => {
            transfer.accountId = newAccountId;
          });
        promises.push(promise);
      }
    });

    // Process nftTransfers for both senderId and receiverId
    dto.nftTransfers.forEach((transfer) => {
      if (shouldSwap(transfer.senderId)) {
        const senderPromise = this.accountService
          .getUserAccountIdByAlias(userId, transfer.senderId)
          .then((newSenderId) => {
            transfer.senderId = newSenderId;
          });
        promises.push(senderPromise);
      }
      if (shouldSwap(transfer.receiverId)) {
        const receiverPromise = this.accountService
          .getUserAccountIdByAlias(userId, transfer.receiverId)
          .then((newReceiverId) => {
            transfer.receiverId = newReceiverId;
          });
        promises.push(receiverPromise);
      }
    });

    // Wait for all promises to resolve
    await Promise.all(promises);

    // Return the updated DTO
    return dto;
  }

  private swapAccountId(
    dto: CreateDealDto,
    alias: DealAlias,
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
      if (transfer.receiverId === alias) {
        transfer.receiverId = newAccountId;
      }
    });

    return dto;
  }

  private async injectNftSerialNumber(
    network: Network,
    dto: CreateDealDto,
    serialNumber: number | undefined = undefined,
  ) {
    if (!dto.nftTransfers.length) return dto;

    // ONLY HANDLE ONE NFT TRANSFER FOR NOW
    if (!dto.nftTransfers[0].serialNumber && !serialNumber) {
      dto.nftTransfers[0].serialNumber = await this.getRandomSerialNumber(
        network,
        dto.nftTransfers[0].tokenId,
        dto.nftTransfers[0].senderId,
      );
    }
    if (!dto.nftTransfers[0].serialNumber) {
      dto.nftTransfers[0].serialNumber = serialNumber;
    }

    return dto;
  }

  private async getRandomSerialNumber(
    network: Network,
    tokenId: string,
    sellerId: string,
  ) {
    let mirrornodeUrl = '';
    switch (network) {
      case Network.MAINNET:
        mirrornodeUrl = MAINNET_MIRRONODE_URL;
        break;
      case Network.TESTNET:
        mirrornodeUrl = TESTNET_MIRRONODE_URL;
        break;
      default:
        throw new BadRequestException('Invalid network');
    }
    try {
      // fetch the nft
      const res = await fetch(
        `${mirrornodeUrl}/accounts/${sellerId}/nfts?token.id=${tokenId}`,
      );
      const { nfts } = await res.json();
      // randomly pick a serial number
      if (nfts.length === 0) {
        throw new BadRequestException(
          `The seller ${sellerId} does not own the NFT: ${tokenId}`,
        );
      }
      const randomIndex = Math.floor(Math.random() * nfts.length);
      const randomSerialNumber = nfts[randomIndex].serial_number;
      return randomSerialNumber;
    } catch (err) {
      throw new ServiceUnavailableException('Error setting NFT serial', {
        description: err.message,
        cause: err,
      });
    }
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
