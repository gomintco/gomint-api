import { BaseError } from 'src/core/base.error';

export class DecryptionFailedError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Decryption failed');
  }
}
