import { Test, TestingModule } from '@nestjs/testing';
import { HederaTokenApiService } from './hedera-token-api.service';
import { IpfsService } from 'src/ipfs/ipfs.service';
import { TokenCreateDto } from 'src/token/dto/token-create.dto';
import { TokenMintDto } from 'src/token/dto/token-mint.dto';
import { AssociateTokenDto } from './token.interface';
import {
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TokenSupplyType,
  PublicKey,
} from '@hashgraph/sdk';

describe('HederaTokenApiService', () => {
  let service: HederaTokenApiService;
  let ipfsService: IpfsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HederaTokenApiService,
        {
          provide: IpfsService,
          useValue: {
            initClient: jest.fn(),
            uploadMetadata: jest.fn().mockResolvedValue('ipfs://some-cid'),
          },
        },
      ],
    }).compile();

    service = module.get<HederaTokenApiService>(HederaTokenApiService);
    ipfsService = module.get<IpfsService>(IpfsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransaction', () => {
    it('should create a TokenCreateTransaction instance with the correct parameters', async () => {
      const tokenCreateDto: TokenCreateDto = {
        tokenName: 'Test Token',
        tokenType: 'ft',
        tokenSymbol: 'TT',
        treasuryAccountId: '0.0.1234',
      };

      // Mock the method that handles the input parsing
      jest
        .spyOn(service as any, 'parseCreateTransactionDto')
        .mockResolvedValue({
          tokenName: 'Test Token',
          tokenSymbol: 'TT',
          tokenType: TokenSupplyType.Finite,
          treasuryAccountId: '0.0.1234',
          decimals: 0,
          initialSupply: 0,
          maxSupply: 1000,
          expirationTime: new Date(),
          autoRenewAccountId: '0.0.1234',
          supplyType: TokenSupplyType.Finite,
          customFees: [],
          metadata: Buffer.from('metadata'),
        });

      const transaction = await service.createTransaction(tokenCreateDto);

      expect(transaction).toBeInstanceOf(TokenCreateTransaction);
      expect(transaction.tokenName).toBe('Test Token');
      expect(transaction.tokenSymbol).toBe('TT');
    });
  });

  describe('mintFtTransaction', () => {
    it('should create a TokenMintTransaction instance with the correct parameters', () => {
      const tokenMintDto: TokenMintDto = {
        tokenType: 'ft',
        tokenId: '0.0.1234',
        amount: 100,
        supplyKey: 'default',
        payerId: '0.0.5678',
      };

      const transaction = service.mintFtTransaction(tokenMintDto);

      expect(transaction).toBeInstanceOf(TokenMintTransaction);
      expect(transaction.amount.toNumber()).toBe(100);
    });
  });

  describe('mintNftTransaction', () => {
    it('should create a TokenMintTransaction instance with metadata uploaded to IPFS', async () => {
      const tokenMintDto: TokenMintDto = {
        tokenType: 'nft',
        tokenId: '0.0.1234',
        metadatas: ['metadata1', 'metadata2'],
        supplyKey: 'default',
        payerId: '0.0.5678',
      };

      const transaction = await service.mintNftTransaction(tokenMintDto);

      expect(transaction).toBeInstanceOf(TokenMintTransaction);
      expect(transaction.metadata.length).toBe(2);
      expect(ipfsService.initClient).toHaveBeenCalled();
    });
  });

  describe('associateTransaction', () => {
    it('should create a TokenAssociateTransaction instance with the correct parameters', () => {
      const associateTokenDto: AssociateTokenDto = {
        associatingId: '0.0.1234',
        tokenIds: ['0.0.5678'],
      };

      const transaction = service.associateTransaction(associateTokenDto);

      expect(transaction).toBeInstanceOf(TokenAssociateTransaction);
      expect(transaction.accountId.toString()).toBe('0.0.1234');
      expect(transaction.tokenIds.map((tokenId) => tokenId.toString())).toEqual(
        ['0.0.5678'],
      );
    });
  });
});
