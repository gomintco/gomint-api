import { BaseError } from 'src/core/base.error';

export class SettingNftSerialError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Failed to set NFT serial');
  }
}
