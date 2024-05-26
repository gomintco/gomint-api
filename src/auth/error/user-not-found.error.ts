import { BaseError } from 'src/core/base.error';

export class UserNotFoundError extends BaseError {
  options: { cause: any; description: string };

  constructor(message?: string, cause?: any, description?: string) {
    super(message ?? 'User is not found');
    this.options = { cause, description };
  }
}
