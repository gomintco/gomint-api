import { CreateFtDto } from './ft/dto/create-ft.dto';
import { FtCreateInput } from './ft/ft.interface';
import { CreateNftDto } from './nft/dto/create-nft.dto';
import { NftCreateInput } from './nft/nft.interface';
import {
  CustomFee,
  CustomFixedFee,
  Hbar,
  Key,
  PublicKey,
} from '@hashgraph/sdk';
import { FixedFee, TokenPublicKeys } from './token.interface';
import { BadRequestException } from '@nestjs/common';

export class TokenService {
  constructor() {}

  // used in ft and nft services for creating custom fees
  protected parseFixedFee = (
    fee: FixedFee,
    defaultId: string,
  ): CustomFixedFee => {
    const customFee = new CustomFixedFee().setFeeCollectorAccountId(
      this.getFeeCollectorAccountId(fee.feeCollectorAccountId, defaultId),
    );
    if (fee.hbarAmount) customFee.setHbarAmount(new Hbar(fee.hbarAmount));
    if (fee.ftId) {
      if (!fee.ftAmount)
        throw new BadRequestException(
          'ftAmount is required when ftId is provided',
        );
      customFee.setAmount(fee.ftAmount).setDenominatingTokenId(fee.ftId);
    }
    customFee.setAllCollectorsAreExempt(fee.allCollectorsAreExempt);
    return customFee;
  };

  // used in ft and nft services for creating custom fees
  protected getFeeCollectorAccountId = (
    accountId: string,
    defaultId: string,
  ) => (accountId === 'default' ? defaultId : accountId);

  protected parsePublicKeys = (
    createTokenDto: CreateFtDto | CreateNftDto,
    defaultKey: string,
  ): TokenPublicKeys => {
    const keys = {
      adminKey: createTokenDto.adminKey,
      freezeKey: createTokenDto.freezeKey,
      kycKey: createTokenDto.kycKey,
      pauseKey: createTokenDto.pauseKey,
      supplyKey: createTokenDto.supplyKey,
      wipeKey: createTokenDto.wipeKey,
    };
    const tokenPublicKeys: TokenPublicKeys = {};
    Object.entries(keys).forEach(([keyType, keyValue]) => {
      if (keyValue) {
        tokenPublicKeys[keyType as keyof TokenPublicKeys] =
          keyValue === 'default'
            ? PublicKey.fromString(defaultKey)
            : PublicKey.fromString(keyValue);
      }
    });
    return tokenPublicKeys;
  };

  protected uniqueKeys(tCreateInput: FtCreateInput | NftCreateInput) {
    const keys = [
      tCreateInput.adminKey,
      tCreateInput.freezeKey,
      tCreateInput.kycKey,
      tCreateInput.pauseKey,
      tCreateInput.supplyKey,
      tCreateInput.wipeKey,
    ].filter((key) => key != undefined);
    return new Set<Key>(keys);
  }

  protected todayPlus90Days() {
    return new Date(new Date().setDate(new Date().getDate() + 90));
  }
}
