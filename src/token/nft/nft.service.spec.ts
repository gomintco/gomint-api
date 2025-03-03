import { Test, TestingModule } from '@nestjs/testing';
import { NftService } from './nft.service';
import { KeyService } from '../../key/key.service';
import { ClientService } from '../../client/client.service';
import { AccountService } from '../../account/account.service';
import { HederaTransactionApiService } from '../../hedera-api/hedera-transaction-api/hedera-transaction-api.service';
import { HederaTokenApiService } from '../../hedera-api/hedera-token-api/hedera-token-api.service';
import { HederaMirrornodeApiService } from '../../hedera-api/hedera-mirrornode-api/hedera-mirrornode-api.service';
import { User } from '../../user/user.entity';
import { TokenCreateDto } from '../dto/token-create.dto';
import { TokenMintDto } from '../dto/token-mint.dto';
import { Account } from '../../account/account.entity';
import {
  PrivateKey,
  TokenCreateTransaction,
  TokenMintTransaction,
  TransactionReceipt,
  Client,
} from '@hashgraph/sdk';
import { TokenMirrornodeInfo } from '../token.interface';

describe('NftService', () => {
  let nftService: NftService;
  let keyService: KeyService;
  let clientService: ClientService;
  let accountService: AccountService;
  let tokenService: HederaTokenApiService;
  let transactionService: HederaTransactionApiService;
  let mirrornodeService: HederaMirrornodeApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NftService,
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
            mintNftTransaction: jest.fn(),
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

    nftService = module.get<NftService>(NftService);
    keyService = module.get<KeyService>(KeyService);
    clientService = module.get<ClientService>(ClientService);
    accountService = module.get<AccountService>(AccountService);
    tokenService = module.get<HederaTokenApiService>(HederaTokenApiService);
    transactionService = module.get<HederaTransactionApiService>(
      HederaTransactionApiService,
    );
    mirrornodeService = module.get<HederaMirrornodeApiService>(
      HederaMirrornodeApiService,
    );
  });

  describe('tokenCreateHandler', () => {
    it('should successfully create a token and return the token ID', async () => {
      const user: User = {
        /* mock user data */
      } as User;
      const createNftDto: TokenCreateDto = {
        /* mock dto data */
      } as TokenCreateDto;
      const mockEscrowKey = 'mockEscrowKey';
      const mockTreasuryAccount: Account = {
        keys: [{ publicKey: 'mockPublicKey' }],
      } as Account;
      const mockPrivateKey = {
        // mock the methods and properties of the PrivateKey as needed
      } as unknown as PrivateKey;
      const mockSigners: PrivateKey[] = [mockPrivateKey];
      const mockClient = {
        // mock the methods and properties of NodeClient as needed
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
        ...createNftDto,
        fixedFees: [],
        royaltyFees: [],
      } as TokenCreateDto);
      const mockTransaction = {
        // mock the methods and properties of TokenCreateTransaction as needed
      } as unknown as TokenCreateTransaction;
      jest
        .spyOn(tokenService, 'createTransaction')
        .mockResolvedValue(mockTransaction);
      jest
        .spyOn(transactionService, 'freezeSignExecuteAndGetReceipt')
        .mockResolvedValue(mockReceipt);

      const result = await nftService.tokenCreateHandler(user, createNftDto);

      expect(keyService.decryptUserEscrowKey).toHaveBeenCalledWith(
        user,
        undefined,
      );
      expect(accountService.getUserAccountByAlias).toHaveBeenCalledWith(
        user.id,
        createNftDto.treasuryAccountId,
      );
      expect(clientService.buildClientAndSigningKeys).toHaveBeenCalledWith(
        user.network,
        mockEscrowKey,
        mockTreasuryAccount,
        undefined,
      );
      expect(accountService.parseCustomFeeAliases).toHaveBeenCalledWith(
        user.id,
        createNftDto,
      );
      expect(tokenService.createTransaction).toHaveBeenCalledWith(
        createNftDto,
        mockTreasuryAccount.keys[0].publicKey,
      );
      expect(
        transactionService.freezeSignExecuteAndGetReceipt,
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
        /* mock account data */
      } as Account;
      const mockPrivateKey = {
        // mock the methods and properties of the PrivateKey as needed
      } as unknown as PrivateKey;
      const mockSigners: PrivateKey[] = [mockPrivateKey];
      const mockClient = {
        // mock the methods and properties of NodeClient as needed
      } as unknown as Client;
      const mockReceipt = {
        status: 'SUCCESS',
        // add other necessary properties for TransactionReceipt
      } as unknown as TransactionReceipt;

      jest
        .spyOn(keyService, 'decryptUserEscrowKey')
        .mockReturnValue(mockEscrowKey);
      jest
        .spyOn(mirrornodeService, 'getTokenMirrornodeInfo')
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
        .spyOn(tokenService, 'mintNftTransaction')
        .mockResolvedValue(mockMintTransaction);
      jest
        .spyOn(transactionService, 'freezeSignExecuteAndGetReceipt')
        .mockResolvedValue(mockReceipt);

      const result = await nftService.tokenMintHandler(user, tokenMintDto);

      expect(keyService.decryptUserEscrowKey).toHaveBeenCalledWith(
        user,
        undefined,
      );
      expect(mirrornodeService.getTokenMirrornodeInfo).toHaveBeenCalledWith(
        user.network,
        tokenMintDto.tokenId,
      );
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
      expect(tokenService.mintNftTransaction).toHaveBeenCalledWith(
        tokenMintDto,
      );
      expect(
        transactionService.freezeSignExecuteAndGetReceipt,
      ).toHaveBeenCalledWith(mockMintTransaction, mockClient, mockSigners);
      expect(result).toBe('SUCCESS');
    });
  });
});
