import { Injectable } from '@nestjs/common';
import { HederaMirrornodeApiService } from 'src/hedera-api/hedera-mirrornode-api/hedera-mirrornode-api.service';
import { HederaTokenApiService } from 'src/hedera-api/hedera-token-api/hedera-token-api.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly hederaTokenApiService: HederaTokenApiService,
    private readonly hederaMirrornodeApiService: HederaMirrornodeApiService,
  ) { }
}
