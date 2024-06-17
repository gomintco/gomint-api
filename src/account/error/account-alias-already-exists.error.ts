import { BaseError } from 'src/core/base.error';

export class AccountAliasAlreadyExists extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Account alias already exists');
  }
}
