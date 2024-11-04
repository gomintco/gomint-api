import { Test, TestingModule } from '@nestjs/testing';
import { FtService } from './ft.service';
import { KeyService } from 'src/key/key.service';
import { ClientService } from 'src/client/client.service';
import { AccountService } from 'src/account/account.service';
import { HederaTransactionApiService } from 'src/hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { HederaTokenApiService } from 'src/hedera-api/hedera-token-api/hedera-token-api.service';
import { HederaMirrornodeApiService } from 'src/hedera-api/hedera-mirrornode-api/hedera-mirrornode-api.service';
import { User } from 'src/user/user.entity';
import { TokenCreateDto } from '../dto/token-create.dto';
import { TokenMintDto } from '../dto/token-mint.dto';
import { Account } from 'src/account/account.entity';
import {
  PrivateKey,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransactionReceipt,
  Client,
} from '@hashgraph/sdk';
import { TokenMirrornodeInfo } from '../token.interface';

describe('FtService', () => {
  let ftService: FtService;
  let keyService: KeyService;
  let clientService: ClientService;
  let accountService: AccountService;
  let tokenService: HederaTokenApiService;
  let hederaTransactionApiService: HederaTransactionApiService;
  let hederaMirrornodeApiService: HederaMirrornodeApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FtService,
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
          provide: AccountService,
          useValue: {
            getUserAccountByAlias: jest.fn(),
            parseCustomFeeAliases: jest.fn(),
            getUserAccountByPublicKey: jest.fn(),
          },
        },
        {
          provide: HederaTokenApiService,
          useValue: {
            createTransaction: jest.fn(),
            mintFtTransaction: jest.fn(),
          },
        },
        {
          provide: HederaTransactionApiService,
          useValue: {
            freezeSignExecuteAndGetReceipt: jest.fn(),
          },
        },
        {
          provide: HederaMirrornodeApiService,
          useValue: {
            getTokenMirrornodeInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    ftService = module.get<FtService>(FtService);
    keyService = module.get<KeyService>(KeyService);
    clientService = module.get<ClientService>(ClientService);
    accountService = module.get<AccountService>(AccountService);
    tokenService = module.get<HederaTokenApiService>(HederaTokenApiService);
    hederaTransactionApiService = module.get<HederaTransactionApiService>(
      HederaTransactionApiService,
    );
    hederaMirrornodeApiService = module.get<HederaMirrornodeApiService>(
      HederaMirrornodeApiService,
    );
  });

  describe('tokenCreateHandler', () => {
    it('should successfully create a token and return the token ID', async () => {
      const user: User = {
        /* mock user data */
      } as User;
      const tokenCreateDto: TokenCreateDto = {
        /* mock dto data */
      } as TokenCreateDto;
      const mockEscrowKey = 'mockEscrowKey';
      const mockTreasuryAccount: Account = {
        keys: [{ publicKey: 'mockPublicKey' }],
        // other properties as needed
      } as unknown as Account;
      const mockPrivateKey = {
        // mock the methods and properties of the PrivateKey as needed
      } as unknown as PrivateKey;
      const mockSigners: PrivateKey[] = [mockPrivateKey];
      const mockClient = {
        // mock the methods and properties of Client as needed
      } as unknown as Client;
      const mockReceipt = {
        tokenId: '0.0.12345',
        status: 'SUCCESS',
        // add other necessary properties for TransactionReceipt
      } as unknown as TransactionReceipt;

      jest
        .spyOn(keyService, 'decryptUserEscrowKey')
        .mockReturnValue(mockEscrowKey);
      jest
        .spyOn(accountService, 'getUserAccountByAlias')
        .mockResolvedValue(mockTreasuryAccount);
      jest.spyOn(clientService, 'buildClientAndSigningKeys').mockReturnValue({
        client: mockClient,
        signers: mockSigners,
      });
      jest.spyOn(accountService, 'parseCustomFeeAliases').mockResolvedValue({
        ...tokenCreateDto,
        fixedFees: [],
        fractionalFees: [],
      } as TokenCreateDto);
      const mockTransaction = {
        // mock the methods and properties of TokenCreateTransaction as needed
      } as unknown as TokenCreateTransaction;
      jest
        .spyOn(tokenService, 'createTransaction')
        .mockResolvedValue(mockTransaction);
      jest
        .spyOn(hederaTransactionApiService, 'freezeSignExecuteAndGetReceipt')
        .mockResolvedValue(mockReceipt);

      const result = await ftService.tokenCreateHandler(user, tokenCreateDto);

      expect(keyService.decryptUserEscrowKey).toHaveBeenCalledWith(
        user,
        undefined,
      );
      expect(accountService.getUserAccountByAlias).toHaveBeenCalledWith(
        user.id,
        tokenCreateDto.treasuryAccountId,
      );
      expect(clientService.buildClientAndSigningKeys).toHaveBeenCalledWith(
        user.network,
        mockEscrowKey,
        mockTreasuryAccount,
        undefined,
      );
      expect(accountService.parseCustomFeeAliases).toHaveBeenCalledWith(
        user.id,
        tokenCreateDto,
      );
      expect(tokenService.createTransaction).toHaveBeenCalledWith(
        tokenCreateDto,
        'mockPublicKey',
      );
      expect(
        hederaTransactionApiService.freezeSignExecuteAndGetReceipt,
      ).toHaveBeenCalledWith(mockTransaction, mockClient, mockSigners);
      expect(result).toBe('0.0.12345');
    });
  });

  describe('tokenMintHandler', () => {
    it('should successfully mint a token and return the transaction status', async () => {
      const user: User = {
        /* mock user data */
      } as User;
      const tokenMintDto: TokenMintDto = {
        /* mock dto data */
      } as TokenMintDto;
      const mockEscrowKey = 'mockEscrowKey';
      const mockSupplyKey = 'mockSupplyKey';
      const mockSupplyAccount: Account = {
        keys: [{ publicKey: mockSupplyKey }],
        // other properties as needed
      } as unknown as Account;
      const mockPrivateKey = {
        // mock the methods and properties of the PrivateKey as needed
      } as unknown as PrivateKey;
      const mockSigners: PrivateKey[] = [mockPrivateKey];
      const mockClient = {
        // mock the methods and properties of Client as needed
      } as unknown as Client;
      const mockReceipt = {
        status: 'SUCCESS',
        // add other necessary properties for TransactionReceipt
      } as unknown as TransactionReceipt;

      jest
        .spyOn(keyService, 'decryptUserEscrowKey')
        .mockReturnValue(mockEscrowKey);
      jest
        .spyOn(hederaMirrornodeApiService, 'getTokenMirrornodeInfo')
        .mockResolvedValue({
          supply_key: { key: mockSupplyKey, _type: 'ED25519' },
        } as TokenMirrornodeInfo);
      jest
        .spyOn(accountService, 'getUserAccountByPublicKey')
        .mockResolvedValue(mockSupplyAccount);
      jest.spyOn(clientService, 'buildClientAndSigningKeys').mockReturnValue({
        client: mockClient,
        signers: mockSigners,
      });
      const mockMintTransaction = {
        // mock the methods and properties of TokenMintTransaction as needed
      } as unknown as TokenMintTransaction;
      jest
        .spyOn(tokenService, 'mintFtTransaction')
        .mockReturnValue(mockMintTransaction);
      jest
        .spyOn(hederaTransactionApiService, 'freezeSignExecuteAndGetReceipt')
        .mockResolvedValue(mockReceipt);

      const result = await ftService.tokenMintHandler(user, tokenMintDto);

      expect(keyService.decryptUserEscrowKey).toHaveBeenCalledWith(
        user,
        undefined,
      );
      expect(
        hederaMirrornodeApiService.getTokenMirrornodeInfo,
      ).toHaveBeenCalledWith(user.network, tokenMintDto.tokenId);
      expect(accountService.getUserAccountByPublicKey).toHaveBeenCalledWith(
        user.id,
        mockSupplyKey,
      );
      expect(clientService.buildClientAndSigningKeys).toHaveBeenCalledWith(
        user.network,
        mockEscrowKey,
        mockSupplyAccount,
        undefined,
      );
      expect(tokenService.mintFtTransaction).toHaveBeenCalledWith(tokenMintDto);
      expect(
        hederaTransactionApiService.freezeSignExecuteAndGetReceipt,
      ).toHaveBeenCalledWith(mockMintTransaction, mockClient, mockSigners);
      expect(result).toBe('SUCCESS');
    });
  });
});
