import { BaseError } from 'src/core/base.error';

export class UserDuplicationError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'This username or email is already in use');
  }
}
