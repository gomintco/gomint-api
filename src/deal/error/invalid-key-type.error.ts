import { BaseError } from 'src/core/base.error';

export class InvalidKeyType extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Invalid key type');
  }
}
