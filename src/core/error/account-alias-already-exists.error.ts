import { BaseError } from 'src/core/base.error';

export class AccountAliasAlreadyExistsError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Account alias already exists');
  }
}
