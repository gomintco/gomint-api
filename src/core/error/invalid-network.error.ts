import { BaseError } from 'src/core/base.error';

export class InvalidNetworkError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Invalid network');
  }
}
