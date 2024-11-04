import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { HederaTokenApiService } from '../hedera-api/hedera-token-api/hedera-token-api.service';
import { AccountService } from '../account/account.service';
import { KeyService } from '../key/key.service';
import { ClientService } from '../client/client.service';
import { HederaTransactionApiService } from '../hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { User } from '../user/user.entity';
import { TokenAssociateDto } from './dto/token-associate.dto';
import { Account } from '../account/account.entity';
import { AccountNotFoundError } from '../core/error';
import { PrivateKey, TransactionReceipt, Client } from '@hashgraph/sdk';

describe('TokenService', () => {
  let tokenService: TokenService;
  let hederaTokenApiService: HederaTokenApiService;
  let accountService: AccountService;
  let keyService: KeyService;
  let clientService: ClientService;
  let hederaTransactionApiService: HederaTransactionApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: HederaTokenApiService,
          useValue: {
            associateTransaction: jest.fn(),
          },
        },
        {
          provide: AccountService,
          useValue: {
            getUserAccountByAlias: jest.fn(),
          },
        },
        {
          provide: KeyService,
          useValue: {
            decryptUserEscrowKey: jest.fn(),
          },
        },
        {
          provide: ClientService,
          useValue: {
            buildClientAndSigningKeys: jest.fn(),
          },
        },
        {
          provide: HederaTransactionApiService,
          useValue: {
            freezeSignExecuteAndGetReceipt: jest.fn(),
          },
        },
      ],
    }).compile();

    tokenService = module.get<TokenService>(TokenService);
    hederaTokenApiService = module.get<HederaTokenApiService>(
      HederaTokenApiService,
    );
    accountService = module.get<AccountService>(AccountService);
    keyService = module.get<KeyService>(KeyService);
    clientService = module.get<ClientService>(ClientService);
    hederaTransactionApiService = module.get<HederaTransactionApiService>(
      HederaTransactionApiService,
    );
  });

  describe('tokenAssociateHandler', () => {
    it('should successfully associate a token and return the transaction status', async () => {
      const user: User = { id: 'userId' } as User;
      const tokenAssociateDto: TokenAssociateDto = {
        associatingId: 'associatingId',
      } as TokenAssociateDto;
      const mockEscrowKey = 'mockEscrowKey';
      const mockAssociatingAccount: Account = {
        id: 'associatingAccountId',
        keys: [{ publicKey: 'mockPublicKey' }],
      } as unknown as Account;
      const mockPrivateKey = {} as unknown as PrivateKey;
      const mockSigners: PrivateKey[] = [mockPrivateKey];
      const mockClient = {} as unknown as Client;
      const mockReceipt = {
        status: 'SUCCESS',
      } as unknown as TransactionReceipt;

      jest
        .spyOn(keyService, 'decryptUserEscrowKey')
        .mockReturnValue(mockEscrowKey);
      jest
        .spyOn(accountService, 'getUserAccountByAlias')
        .mockResolvedValue(mockAssociatingAccount);
      jest.spyOn(clientService, 'buildClientAndSigningKeys').mockReturnValue({
        client: mockClient,
        signers: mockSigners,
      });
      const mockTransaction = {} as unknown as any;
      jest
        .spyOn(hederaTokenApiService, 'associateTransaction')
        .mockReturnValue(mockTransaction);
      jest
        .spyOn(hederaTransactionApiService, 'freezeSignExecuteAndGetReceipt')
        .mockResolvedValue(mockReceipt);

      const result = await tokenService.tokenAssociateHandler(
        user,
        tokenAssociateDto,
      );

      expect(keyService.decryptUserEscrowKey).toHaveBeenCalledWith(
        user,
        undefined,
      );
      expect(accountService.getUserAccountByAlias).toHaveBeenCalledWith(
        user.id,
        'associatingId',
      );
      expect(clientService.buildClientAndSigningKeys).toHaveBeenCalledWith(
        user.network,
        mockEscrowKey,
        mockAssociatingAccount,
        undefined,
      );
      expect(hederaTokenApiService.associateTransaction).toHaveBeenCalledWith(
        tokenAssociateDto,
      );
      expect(
        hederaTransactionApiService.freezeSignExecuteAndGetReceipt,
      ).toHaveBeenCalledWith(mockTransaction, mockClient, mockSigners);
      expect(result).toBe('SUCCESS');
    });

    it('should throw AccountNotFoundError if associating account is not found', async () => {
      const user: User = { id: 'userId' } as User;
      const tokenAssociateDto: TokenAssociateDto = {
        associatingId: 'associatingId',
      } as TokenAssociateDto;

      jest
        .spyOn(accountService, 'getUserAccountByAlias')
        .mockRejectedValue(new AccountNotFoundError());

      await expect(
        tokenService.tokenAssociateHandler(user, tokenAssociateDto),
      ).rejects.toThrow(AccountNotFoundError);

      expect(accountService.getUserAccountByAlias).toHaveBeenCalledWith(
        user.id,
        'associatingId',
      );
    });

    it('should throw AccountNotFoundError if payer account is not found', async () => {
      const user: User = { id: 'userId' } as User;
      const tokenAssociateDto: TokenAssociateDto = {
        associatingId: 'associatingId',
        payerId: 'payerId',
      } as TokenAssociateDto;
      const mockAssociatingAccount: Account = {
        id: 'associatingAccountId',
      } as unknown as Account;

      jest
        .spyOn(accountService, 'getUserAccountByAlias')
        .mockResolvedValueOnce(mockAssociatingAccount)
        .mockRejectedValueOnce(new AccountNotFoundError());

      await expect(
        tokenService.tokenAssociateHandler(user, tokenAssociateDto),
      ).rejects.toThrow(AccountNotFoundError);

      expect(accountService.getUserAccountByAlias).toHaveBeenCalledWith(
        user.id,
        'associatingId',
      );
      expect(accountService.getUserAccountByAlias).toHaveBeenCalledWith(
        user.id,
        'payerId',
      );
    });

    it('should handle case where payerId is provided', async () => {
      const user: User = { id: 'userId' } as User;
      const tokenAssociateDto: TokenAssociateDto = {
        associatingId: 'associatingId',
        payerId: 'payerId',
      } as TokenAssociateDto;
      const mockEscrowKey = 'mockEscrowKey';
      const mockAssociatingAccount: Account = {
        id: 'associatingAccountId',
        keys: [{ publicKey: 'mockPublicKey' }],
      } as unknown as Account;
      const mockPayerAccount: Account = {
        id: 'payerAccountId',
      } as unknown as Account;
      const mockPrivateKey = {} as unknown as PrivateKey;
      const mockSigners: PrivateKey[] = [mockPrivateKey];
      const mockClient = {} as unknown as Client;
      const mockReceipt = {
        status: 'SUCCESS',
      } as unknown as TransactionReceipt;

      jest
        .spyOn(keyService, 'decryptUserEscrowKey')
        .mockReturnValue(mockEscrowKey);
      jest
        .spyOn(accountService, 'getUserAccountByAlias')
        .mockResolvedValueOnce(mockAssociatingAccount)
        .mockResolvedValueOnce(mockPayerAccount);
      jest.spyOn(clientService, 'buildClientAndSigningKeys').mockReturnValue({
        client: mockClient,
        signers: mockSigners,
      });
      const mockTransaction = {} as unknown as any;
      jest
        .spyOn(hederaTokenApiService, 'associateTransaction')
        .mockReturnValue(mockTransaction);
      jest
        .spyOn(hederaTransactionApiService, 'freezeSignExecuteAndGetReceipt')
        .mockResolvedValue(mockReceipt);

      const result = await tokenService.tokenAssociateHandler(
        user,
        tokenAssociateDto,
      );

      expect(keyService.decryptUserEscrowKey).toHaveBeenCalledWith(
        user,
        undefined,
      );
      expect(accountService.getUserAccountByAlias).toHaveBeenCalledWith(
        user.id,
        'associatingId',
      );
      expect(accountService.getUserAccountByAlias).toHaveBeenCalledWith(
        user.id,
        'payerId',
      );
      expect(clientService.buildClientAndSigningKeys).toHaveBeenCalledWith(
        user.network,
        mockEscrowKey,
        mockAssociatingAccount,
        mockPayerAccount,
      );
      expect(hederaTokenApiService.associateTransaction).toHaveBeenCalledWith(
        tokenAssociateDto,
      );
      expect(
        hederaTransactionApiService.freezeSignExecuteAndGetReceipt,
      ).toHaveBeenCalledWith(mockTransaction, mockClient, mockSigners);
      expect(result).toBe('SUCCESS');
    });
  });
});
