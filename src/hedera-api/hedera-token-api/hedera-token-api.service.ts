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

// WHY DID I CREATE NEW DTOS HERE??
// WHY DON'T I JUST USE THE SAME AS IN THE CONTROLLER...
// LETS FIX LATER lol
import {
  AssociateTokenDto,
  //TokenCreateDto,
  TokenCreateTransactionInput,
  MintFtDto,
  MintNftDto,
} from './token.interface';
import { TokenCreateKeys, TokenCreateKeysDto } from './pubKey.interface';
import { FixedFeeDto, FractionalFeeDto, RoyaltyFeeDto } from './fee.interface';
import { TokenCreateDto } from 'src/token/dto/create-token.dto';

@Injectable()
export class HederaTokenApiService {
  nDays = 90;

  createTransaction(tokenCreateDto: TokenCreateDto, defaultKey?: string) {
    // parses input data into correct format
    const createTokenTransaction = this.parseCreateTransactionDto(
      tokenCreateDto,
      defaultKey,
    );
    const transaction = new TokenCreateTransaction()
      .setTokenName(createTokenTransaction.tokenName)
      .setTokenSymbol(createTokenTransaction.tokenSymbol)
      .setDecimals(createTokenTransaction.decimals)
      .setInitialSupply(createTokenTransaction.initialSupply)
      .setTreasuryAccountId(createTokenTransaction.treasuryAccountId)
      .setTokenType(createTokenTransaction.tokenType)
      .setAdminKey(createTokenTransaction.adminKey)
      .setKycKey(createTokenTransaction.kycKey)
      .setFreezeKey(createTokenTransaction.freezeKey)
      .setWipeKey(createTokenTransaction.wipeKey)
      .setSupplyKey(createTokenTransaction.supplyKey)
      .setPauseKey(createTokenTransaction.pauseKey)
      .setFreezeDefault(createTokenTransaction.freezeDefault)
      .setExpirationTime(createTokenTransaction.expirationTime)
      .setFeeScheduleKey(createTokenTransaction.feeScheduleKey)
      .setCustomFees(createTokenTransaction.customFees)
      .setSupplyType(createTokenTransaction.supplyType)
      .setMaxSupply(createTokenTransaction.maxSupply)
      .setTokenMemo(createTokenTransaction.tokenMemo)
      .setAutoRenewAccountId(createTokenTransaction.autoRenewAccountId)
      .setAutoRenewPeriod(
        createTokenTransaction.autoRenewPeriod ?? this.nDays * 24 * 60 * 60, // 90 days in seconds
      );

    return transaction;
  }

  mintFtTransaction(mintTokenDto: MintFtDto) {
    return new TokenMintTransaction()
      .setTokenId(mintTokenDto.tokenId)
      .setAmount(mintTokenDto.amount);
  }

  mintNftTransaction(mintNftDto: MintNftDto) {
    return new TokenMintTransaction()
      .setTokenId(mintNftDto.tokenId)
      .setMetadata(
        mintNftDto.metadatas.length // handle both metdata formats
          ? mintNftDto.metadatas.map((metadata) => Buffer.from(metadata))
          : Array(mintNftDto.amount).fill(Buffer.from(mintNftDto.metadata)),
      );
  }

  associateTransaction(tokenAssociateInput: AssociateTokenDto) {
    return new TokenAssociateTransaction()
      .setAccountId(tokenAssociateInput.associatingId)
      .setTokenIds(tokenAssociateInput.tokenIds);
  }

  private parseCreateTransactionDto(
    tokenCreateDto: TokenCreateDto,
    defaultKey?: string,
  ): TokenCreateTransactionInput {
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
      expirationTime: new Date(tokenCreateDto.expirationTime) ?? this.todayPlusNDays(),
      autoRenewAccountId:
        tokenCreateDto.autoRenewAccountId ||
        tokenCreateDto.treasuryAccountId,
      supplyType:
        tokenCreateDto.finite || tokenCreateDto.maxSupply
          ? TokenSupplyType.Finite
          : TokenSupplyType.Infinite,
      customFees: this.parseCustomFees(tokenCreateDto),
      ...tokenPubKeys,
    };
    return createTokenTransactionInput;
  }

  private parsePublicKeys(
    createTokenInput: TokenCreateKeysDto,
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

  private parseCustomFees(tokenCreateDto: TokenCreateDto): CustomFee[] {
    // custom fee ids need to have been parsed before this
    const { fixedFees, fractionalFees, royaltyFees } = tokenCreateDto;
    if (!fixedFees && !fractionalFees && !royaltyFees) return [];
    // ensure all fee aliases are parsed correctly before returnin
    this.validateFeeCollectorAccountIds(fixedFees, fractionalFees, royaltyFees);
    const customFees: CustomFee[] = [];
    // set fixed fees
    if (fixedFees)
      customFees.push(...fixedFees.map((fee) => this.parseFixedFee(fee)));
    // set fractional fees
    if (fractionalFees)
      customFees.push(
        ...fractionalFees.map((fee) => this.parseFractionalFee(fee)),
      );
    // set royalty fees
    if (royaltyFees)
      customFees.push(...royaltyFees.map((fee) => this.parseRoyaltyFee(fee)));
    return customFees;
  }

  private validateFeeCollectorAccountIds(
    fixedFees: FixedFeeDto[],
    fractionalFees: FractionalFeeDto[],
    royaltyFees: RoyaltyFeeDto[],
  ) {
    if (fixedFees)
      fixedFees.forEach((fee) => {
        if (!fee.feeCollectorAccountId.startsWith('0.0.'))
          throw new Error(
            "Fixed fee collector account id must start with '0.0.'",
          );
      });
    if (fractionalFees)
      fractionalFees.forEach((fee) => {
        if (!fee.feeCollectorAccountId.startsWith('0.0.'))
          throw new Error(
            "Fractional fee collector account id must start with '0.0.'",
          );
      });
    if (royaltyFees)
      royaltyFees.forEach((fee) => {
        if (!fee.feeCollectorAccountId.startsWith('0.0.'))
          throw new Error(
            "Royalty fee collector account id must start with '0.0.'",
          );
      });
  }

  private parseFixedFee = (fee: FixedFeeDto): CustomFixedFee => {
    const customFee = new CustomFixedFee().setFeeCollectorAccountId(
      fee.feeCollectorAccountId,
    );
    if (fee.hbarAmount) customFee.setHbarAmount(new Hbar(fee.hbarAmount));
    if (fee.ftId) {
      if (!fee.ftAmount)
        throw new Error('ftAmount is required when ftId is provided');
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
    if (fee.fallbackFee)
      royaltyFee.setFallbackFee(this.parseFixedFee(fee.fallbackFee));
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
