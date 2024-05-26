import { BaseError } from 'src/core/base.error';

export class FailedUserSaveError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Error saving user');
  }
}
