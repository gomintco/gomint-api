import { Test, TestingModule } from '@nestjs/testing';
import { HederaAccountApiService } from './hedera-account-api.service';
import { AccountCreateDto } from '../../account/dto/account-create.dto';
import { Key, PrivateKey, AccountCreateTransaction } from '@hashgraph/sdk';
import { KeyType } from 'src/key/key-type.enum';

describe('HederaAccountApiService', () => {
  let service: HederaAccountApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaAccountApiService],
    }).compile();

    service = module.get<HederaAccountApiService>(HederaAccountApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should create a AccountCreateTransaction instance with the correct parameters', () => {
      const accountCreateDto: AccountCreateDto = {
        type: KeyType.ED25519,
        initialBalance: 100,
        receiverSignatureRequired: false,
        maxAutomaticTokenAssociations: 3,
        stakedAccountId: '0.0.1234',
        declineStakingReward: true,
        accountMemo: 'Test Memo',
      };
      
      const key = PrivateKey.generateED25519();
      const transaction = service.createTransaction(accountCreateDto, key);
      
      expect(transaction).toBeInstanceOf(AccountCreateTransaction);
      expect(transaction.key.toString()).toBe(key.toString());
      expect(transaction.maxAutomaticTokenAssociations.toNumber()).toBe(3);
      expect(transaction.stakedAccountId.toString()).toBe('0.0.1234');
      expect(transaction.accountMemo).toBe('Test Memo');
      expect(transaction.declineStakingRewards).toBe(true);
    });
  });
});
