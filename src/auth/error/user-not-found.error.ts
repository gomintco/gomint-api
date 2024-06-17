import { BaseError } from 'src/core/base.error';

export class UserNotFoundError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'User is not found');
  }
}
