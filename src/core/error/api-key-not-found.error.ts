import { BaseError } from 'src/core/base.error';

export class ApiKeyNotFound extends BaseError {
  constructor(message?: string) {
    super(message ?? 'API key not found');
  }
}
