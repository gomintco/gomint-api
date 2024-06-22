import { BaseError } from 'src/core/base.error';

export class InvalidKeyTypeError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Invalid key type');
  }
}
