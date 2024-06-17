import { BaseError } from 'src/core/base.error';

export class DealNotFoundError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Deal does not exist');
  }
}
