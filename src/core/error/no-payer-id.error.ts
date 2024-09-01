import { BaseError } from 'src/core/base.error';

export class NoPayerIdError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Payer ID is required');
  }
}
