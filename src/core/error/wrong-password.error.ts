import { BaseError } from 'src/core/base.error';

export class WrongPasswordError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Wrong password');
  }
}
