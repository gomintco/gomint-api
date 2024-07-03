import { BaseError } from 'src/core/base.error';

export class AccountNotFoundError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Account not found');
  }
}
