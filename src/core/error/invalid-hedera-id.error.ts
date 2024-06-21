import { BaseError } from 'src/core/base.error';

export class InvalidHederaIdError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Invalid Hedera ID');
  }
}
