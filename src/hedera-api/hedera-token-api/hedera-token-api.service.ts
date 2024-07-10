import { Injectable } from '@nestjs/common';
import {
  TokenCreateTransaction,
  TokenType,
  TokenMintTransaction,
  CustomFee,
  CustomRoyaltyFee,
  TokenSupplyType,
  PublicKey,
  CustomFractionalFee,
  FeeAssessmentMethod,
  CustomFixedFee,
  Hbar,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';

import {
  AssociateTokenDto,
  TokenCreateTransactionInput,
} from './token.interface';
import { TokenCreateKeys } from './pubKey.interface';
import { FixedFeeDto, FractionalFeeDto, RoyaltyFeeDto } from './fee.interface';
import { TokenCreateDto } from 'src/token/dto/token-create.dto';
import { TokenMintDto } from 'src/token/dto/token-mint.dto';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { TokenMetadata } from 'src/token/dto/hip412-metadata.dto';
import { TokenCollectionMetadata } from 'src/token/dto/hip766-metadata.dto';
import { InvalidHederaIdError } from 'src/core/error';

@Injectable()
export class HederaTokenApiService {
  nDays = 90;

  constructor(private readonly ipfsService: IpfsService) {}

  async createTransaction(tokenCreateDto: TokenCreateDto, defaultKey?: string) {
    // parses input data into correct format
    const createTokenTransaction = await this.parseCreateTransactionDto(
      tokenCreateDto,
      defaultKey,
    );
    const transaction = new TokenCreateTransaction()
      .setTokenName(createTokenTransaction.tokenName)
      .setTokenType(createTokenTransaction.tokenType)
      .setTokenSymbol(createTokenTransaction.tokenSymbol)
      .setDecimals(createTokenTransaction.decimals)
      .setInitialSupply(createTokenTransaction.initialSupply)
      .setTreasuryAccountId(createTokenTransaction.treasuryAccountId)
      .setAdminKey(createTokenTransaction.adminKey)
      .setKycKey(createTokenTransaction.kycKey)
      .setFreezeKey(createTokenTransaction.freezeKey)
      .setWipeKey(createTokenTransaction.wipeKey)
      .setSupplyKey(createTokenTransaction.supplyKey)
      .setFeeScheduleKey(createTokenTransaction.feeScheduleKey)
      .setPauseKey(createTokenTransaction.pauseKey)
      .setCustomFees(createTokenTransaction.customFees)
      .setMaxSupply(createTokenTransaction.maxSupply)
      .setSupplyType(createTokenTransaction.supplyType)
      .setFreezeDefault(createTokenTransaction.freezeDefault)
      .setExpirationTime(createTokenTransaction.expirationTime)
      .setAutoRenewAccountId(createTokenTransaction.autoRenewAccountId)
      .setAutoRenewPeriod(
        createTokenTransaction.autoRenewPeriod ?? this.nDays * 24 * 60 * 60, // 90 days in seconds
      )
      .setTokenMemo(createTokenTransaction.tokenMemo)
      .setMetadataKey(createTokenTransaction.metadataKey)
      .setMetadata(createTokenTransaction.metadata);

    return transaction;
  }

  mintFtTransaction(tokenMintDto: TokenMintDto) {
    return new TokenMintTransaction()
      .setTokenId(tokenMintDto.tokenId)
      .setAmount(tokenMintDto.amount);
  }

  async mintNftTransaction(tokenMintDto: TokenMintDto) {
    // metadata can either be a string or HIP-412 metadata
    // if a string, we can mint straight away
    // if HIP-412 we need to upload to ipfs and use CID for

    let metadatas: Uint8Array[];

    await this.ipfsService.initClient();
    if (tokenMintDto.amount) {
      const metadata = tokenMintDto.metadata;
      const buffer = await this.createBuffersFromMetadata(metadata);
      metadatas = Array(tokenMintDto.amount).fill(buffer);
    } else {
      const metadatasPromises = tokenMintDto.metadatas.map(
        this.createBuffersFromMetadata,
      );
      metadatas = await Promise.all(metadatasPromises);
    }

    return new TokenMintTransaction()
      .setTokenId(tokenMintDto.tokenId)
      .setMetadata(metadatas);
  }

  associateTransaction(tokenAssociateInput: AssociateTokenDto) {
    return new TokenAssociateTransaction()
      .setAccountId(tokenAssociateInput.associatingId)
      .setTokenIds(tokenAssociateInput.tokenIds);
  }

  private async parseCreateTransactionDto(
    tokenCreateDto: TokenCreateDto,
    defaultKey?: string,
  ): Promise<TokenCreateTransactionInput> {
    const tokenPubKeys = this.parsePublicKeys(tokenCreateDto, defaultKey);
    // MAY STILL BE BITS TO FILL OUT
    let tokenType: TokenType;
    switch (tokenCreateDto.tokenType) {
      case 'ft':
        tokenType = TokenType.FungibleCommon;
        break;
      case 'nft':
        tokenType = TokenType.NonFungibleUnique;
        break;
      default:
        throw new Error("Token type must be 'ft' or 'nft'");
    }

    // handle metadata upload to ipfs
    let metadata: Uint8Array;
    if (tokenCreateDto.metadata) {
      metadata = await this.createBuffersFromMetadata(tokenCreateDto.metadata);
    }

    const createTokenTransactionInput: TokenCreateTransactionInput = {
      tokenName: tokenCreateDto.tokenName,
      tokenSymbol: tokenCreateDto.tokenSymbol,
      tokenType,
      treasuryAccountId: tokenCreateDto.treasuryAccountId,
      decimals: tokenCreateDto.decimals ?? 0,
      initialSupply: tokenCreateDto.initialSupply ?? 0,
      maxSupply:
        // hedera needs max supply if finite
        // if user sets finite with no max supply, max supply is set to initial supply
        tokenCreateDto.finite && !tokenCreateDto.maxSupply
          ? tokenCreateDto.initialSupply
          : tokenCreateDto.maxSupply,
      expirationTime:
        new Date(tokenCreateDto.expirationTime) ?? this.todayPlusNDays(),
      autoRenewAccountId:
        tokenCreateDto.autoRenewAccountId || tokenCreateDto.treasuryAccountId,
      supplyType:
        tokenCreateDto.finite || tokenCreateDto.maxSupply
          ? TokenSupplyType.Finite
          : TokenSupplyType.Infinite,
      customFees: this.parseCustomFees(tokenCreateDto),
      metadata,
      ...tokenPubKeys,
    };
    return createTokenTransactionInput;
  }

  private parsePublicKeys(
    createTokenInput: TokenCreateDto,
    defaultKey?: string,
  ) {
    const keys = {
      adminKey: createTokenInput.adminKey,
      freezeKey: createTokenInput.freezeKey,
      kycKey: createTokenInput.kycKey,
      pauseKey: createTokenInput.pauseKey,
      supplyKey: createTokenInput.supplyKey,
      wipeKey: createTokenInput.wipeKey,
      feeScheduleKey: createTokenInput.feeScheduleKey,
      metadataKey: createTokenInput.metadataKey,
    };
    const tokenPublicKeys: TokenCreateKeys = {};
    Object.entries(keys).forEach(([keyType, keyValue]) => {
      if (keyValue) {
        tokenPublicKeys[keyType as keyof TokenCreateKeys] =
          keyValue === 'default'
            ? PublicKey.fromString(defaultKey)
            : PublicKey.fromString(keyValue);
      }
    });
    return tokenPublicKeys;
  }

  private async createBuffersFromMetadata(
    metadata: string | TokenMetadata | TokenCollectionMetadata,
  ): Promise<Uint8Array> {
    if (typeof metadata === 'string') {
      return Buffer.from(metadata);
    } else {
      const cid = await this.ipfsService.uploadMetadata(metadata);
      return Buffer.from(cid);
    }
  }

  private parseCustomFees(tokenCreateDto: TokenCreateDto): CustomFee[] {
    // custom fee ids need to have been parsed before this
    const { fixedFees, fractionalFees, royaltyFees } = tokenCreateDto;
    if (!fixedFees && !fractionalFees && !royaltyFees) {
      return [];
    }
    // ensure all fee aliases are parsed correctly before returnin
    this.validateFeeCollectorAccountIds(fixedFees, fractionalFees, royaltyFees);
    const customFees: CustomFee[] = [];
    // set fixed fees
    if (fixedFees) {
      customFees.push(...fixedFees.map((fee) => this.parseFixedFee(fee)));
    }
    // set fractional fees
    if (fractionalFees) {
      customFees.push(
        ...fractionalFees.map((fee) => this.parseFractionalFee(fee)),
      );
    }
    // set royalty fees
    if (royaltyFees) {
      customFees.push(...royaltyFees.map((fee) => this.parseRoyaltyFee(fee)));
    }
    return customFees;
  }

  private validateFeeCollectorAccountIds(
    fixedFees: FixedFeeDto[],
    fractionalFees: FractionalFeeDto[],
    royaltyFees: RoyaltyFeeDto[],
  ) {
    if (fixedFees) {
      fixedFees.forEach((fee) => {
        if (!fee.feeCollectorAccountId.startsWith('0.0.')) {
          throw new InvalidHederaIdError(
            "Fixed fee collector account id must start with '0.0.'",
          );
        }
      });
    }
    if (fractionalFees) {
      fractionalFees.forEach((fee) => {
        if (!fee.feeCollectorAccountId.startsWith('0.0.')) {
          throw new InvalidHederaIdError(
            "Fractional fee collector account id must start with '0.0.'",
          );
        }
      });
    }
    if (royaltyFees) {
      royaltyFees.forEach((fee) => {
        if (!fee.feeCollectorAccountId.startsWith('0.0.')) {
          throw new InvalidHederaIdError(
            "Royalty fee collector account id must start with '0.0.'",
          );
        }
      });
    }
  }

  private parseFixedFee = (fee: FixedFeeDto): CustomFixedFee => {
    const customFee = new CustomFixedFee().setFeeCollectorAccountId(
      fee.feeCollectorAccountId,
    );
    if (fee.hbarAmount) {
      customFee.setHbarAmount(new Hbar(fee.hbarAmount));
    }
    if (fee.ftId) {
      if (!fee.ftAmount) {
        throw new Error('ftAmount is required when ftId is provided');
      }
      customFee.setAmount(fee.ftAmount).setDenominatingTokenId(fee.ftId);
    }
    customFee.setAllCollectorsAreExempt(fee.allCollectorsAreExempt);
    return customFee;
  };

  private parseRoyaltyFee(fee: RoyaltyFeeDto) {
    const royaltyFee = new CustomRoyaltyFee()
      .setFeeCollectorAccountId(fee.feeCollectorAccountId)
      .setNumerator(fee.numerator)
      .setDenominator(fee.denominator)
      .setAllCollectorsAreExempt(fee.allCollectorsAreExempt);
    if (fee.fallbackFee) {
      royaltyFee.setFallbackFee(this.parseFixedFee(fee.fallbackFee));
    }
    return royaltyFee;
  }

  private parseFractionalFee(fee: FractionalFeeDto) {
    return new CustomFractionalFee()
      .setFeeCollectorAccountId(fee.feeCollectorAccountId)
      .setNumerator(fee.numerator)
      .setDenominator(fee.denominator)
      .setMax(fee.max)
      .setMin(fee.min)
      .setAssessmentMethod(new FeeAssessmentMethod(fee.senderPaysFees)) // prob need to fall back on false here
      .setAllCollectorsAreExempt(fee.allCollectorsAreExempt);
  }

  private todayPlusNDays(n: number = this.nDays): Date {
    return new Date(new Date().setDate(new Date().getDate() + n));
  }
}
