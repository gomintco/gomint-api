import { BadRequestException, Injectable } from '@nestjs/common';
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
  PublicKey,
  CustomFractionalFee,
  FeeAssessmentMethod,
  CustomFixedFee,
  Hbar,
  TokenAssociateTransaction,
} from '@hashgraph/sdk';
import {
  AssociateTokenDto,
  CreateTokenDto,
  CreateTokenTransaction,
  MintFtDto,
  MintNftDto,
} from './token.interface';
import { CreateTokenKeys, CreateTokenKeysDto } from './pubKey.interface';
import { FixedFeeDto, FractionalFeeDto, RoyaltyFeeDto } from './fee.interface';

@Injectable()
export class TokenService {
  nDays = 90;

  createTransaction(
    tokenCreateInput: CreateTokenDto,
    tokenType: TokenType,
    defaultKey?: string,
  ) {
    // parses input data into correct format
    const createTokenTransaction = this.parseCreateTransactionDto(
      tokenCreateInput,
      defaultKey,
    );
    const transaction = new TokenCreateTransaction()
      .setTokenName(createTokenTransaction.tokenName)
      .setTokenSymbol(createTokenTransaction.tokenSymbol)
      .setDecimals(createTokenTransaction.decimals)
      .setInitialSupply(createTokenTransaction.initialSupply)
      .setTreasuryAccountId(createTokenTransaction.treasuryAccountId)
      .setTokenType(tokenType)
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
    tokenCreateInput: CreateTokenDto,
    defaultKey?: string,
  ): CreateTokenTransaction {
    const tokenPubKeys = this.parsePublicKeys(tokenCreateInput, defaultKey);
    // MAY STILL BE BITS TO FILL OUT
    const createTokenTransaction: CreateTokenTransaction = {
      tokenName: tokenCreateInput.tokenName,
      tokenSymbol: tokenCreateInput.tokenSymbol,
      treasuryAccountId: tokenCreateInput.treasuryAccountId,
      decimals: tokenCreateInput.decimals ?? 0,
      initialSupply: tokenCreateInput.initialSupply ?? 0,
      maxSupply:
        // hedera needs max supply if finite
        // if user sets finite with no max supply, max supply is set to initial supply
        tokenCreateInput.finite && !tokenCreateInput.maxSupply
          ? tokenCreateInput.initialSupply
          : tokenCreateInput.maxSupply,
      expirationTime: tokenCreateInput.expirationTime ?? this.todayPlusNDays(),
      autoRenewAccountId:
        tokenCreateInput.autoRenewAccountId ||
        tokenCreateInput.treasuryAccountId,
      supplyType:
        tokenCreateInput.finite || tokenCreateInput.maxSupply
          ? TokenSupplyType.Finite
          : TokenSupplyType.Infinite,
      customFees: this.parseCustomFees(tokenCreateInput),
      ...tokenPubKeys,
    };
    return createTokenTransaction;
  }

  private parsePublicKeys(
    createTokenInput: CreateTokenKeysDto,
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
    const tokenPublicKeys: CreateTokenKeys = {};
    Object.entries(keys).forEach(([keyType, keyValue]) => {
      if (keyValue) {
        tokenPublicKeys[keyType as keyof CreateTokenKeys] =
          keyValue === 'default'
            ? PublicKey.fromString(defaultKey)
            : PublicKey.fromString(keyValue);
      }
    });
    return tokenPublicKeys;
  }

  private parseCustomFees(tokenCreateInput: CreateTokenDto): CustomFee[] {
    // custom fee ids need to have been parsed before this
    const { fixedFees, fractionalFees, royaltyFees } = tokenCreateInput;
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
