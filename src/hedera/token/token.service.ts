import { Injectable } from '@nestjs/common';
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
} from '@hashgraph/sdk';
import { CreateTokenDto, CreateTokenTransaction } from './token.interface';
import { CreateTokenKeys, CreateTokenKeysDto } from './pubKey.interface';

@Injectable()
export class TokenService {
  createTransaction(tokenCreateInput: CreateTokenDto, defaultKey: string) {
    // parses input data into correct format
    const createTokenTransaction = this.parseTransaction(
      tokenCreateInput,
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
      .setExpirationTime(
        createTokenTransaction.expirationTime ?? this.todayPlusNDays(90),
      )
      .setFeeScheduleKey(createTokenTransaction.feeScheduleKey)
      .setCustomFees(createTokenTransaction.customFees ?? [])
      .setSupplyType(
        createTokenTransaction.supplyType ?? createTokenTransaction.maxSupply // if maxSupply is provided, supplyType is finite
          ? TokenSupplyType.Finite
          : TokenSupplyType.Infinite,
      )
      .setMaxSupply(createTokenTransaction.maxSupply)
      .setTokenMemo(createTokenTransaction.tokenMemo)
      .setAutoRenewAccountId(
        createTokenTransaction.autoRenewAccountId ??
          createTokenTransaction.treasuryAccountId,
      )
      .setAutoRenewPeriod(
        createTokenTransaction.autoRenewPeriod ??
          this.todayPlusNDays(90).getUTCSeconds(),
      );

    return transaction;
  }

  private parseTransaction(
    tokenCreateInput: CreateTokenDto,
    defaultKey: string,
  ): CreateTokenTransaction {
    const tokenPubKeys = this.parsePublicKeys(tokenCreateInput, defaultKey);
    // MAY STILL BE BITS TO FILL OUT
    const createTokenTransaction: CreateTokenTransaction = {
      tokenName: tokenCreateInput.tokenName,
      tokenSymbol: tokenCreateInput.tokenSymbol,
      tokenType: tokenCreateInput.tokenType,
      treasuryAccountId: tokenCreateInput.treasuryAccountId,
      decimals: tokenCreateInput.decimals ?? 0,
      initialSupply: tokenCreateInput.initialSupply ?? 0,
      maxSupply: tokenCreateInput.maxSupply,
      supplyType: tokenCreateInput.finite
        ? TokenSupplyType.Finite
        : TokenSupplyType.Infinite,
      ...tokenPubKeys,
    };
    return createTokenTransaction;
  }

  private parsePublicKeys(
    createTokenInput: CreateTokenKeysDto,
    defaultKey: string,
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

  private todayPlusNDays(n: number) {
    return new Date(new Date().setDate(new Date().getDate() + n));
  }
}
