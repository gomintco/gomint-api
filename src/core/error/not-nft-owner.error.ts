import { BaseError } from 'src/core/base.error';

export class NotNftOwnerError extends BaseError {
  constructor(message?: string) {
    super(message ?? 'Seller is not owner of this NFT');
  }
}
