import { BaseError } from 'src/core/base.error';

export class EncryptionKeyNotProvidedError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Encryption key is not provided');
  }
}
