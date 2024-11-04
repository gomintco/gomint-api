import { Test, TestingModule } from '@nestjs/testing';
import { HederaTransactionApiService } from './hedera-transaction-api.service';
import {
  AccountId,
  Client,
  PrivateKey,
  Transaction,
  TransactionId,
} from '@hashgraph/sdk';

describe('HederaTransactionApiService', () => {
  let service: HederaTransactionApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaTransactionApiService],
    }).compile();

    service = module.get<HederaTransactionApiService>(
      HederaTransactionApiService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('executeTransaction', () => {
    it('should execute a transaction without signers', async () => {
      const mockTransaction = {
        execute: jest.fn().mockResolvedValue({}),
      } as unknown as Transaction;
      const mockClient = {} as Client;

      const result = await service.executeTransaction(
        mockTransaction,
        mockClient,
      );

      expect(mockTransaction.execute).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual({});
    });

    it('should execute a transaction with signers', async () => {
      const mockTransaction = {
        execute: jest.fn().mockResolvedValue({}),
        sign: jest.fn().mockResolvedValue(undefined),
        isFrozen: jest.fn().mockReturnValue(true),
      } as unknown as Transaction;
      const mockClient = {} as Client;
      const mockSigners = [PrivateKey.generate(), PrivateKey.generate()];

      const result = await service.executeTransaction(
        mockTransaction,
        mockClient,
        mockSigners,
      );

      expect(mockTransaction.sign).toHaveBeenCalledTimes(mockSigners.length);
      expect(mockTransaction.execute).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual({});
    });
  });

  describe('freezeWithClient', () => {
    it('should freeze the transaction with the client', () => {
      const mockTransaction = {
        freezeWith: jest.fn().mockReturnThis(),
      } as unknown as Transaction;
      const mockClient = {} as Client;

      const result = service.freezeWithClient(mockTransaction, mockClient);

      expect(mockTransaction.freezeWith).toHaveBeenCalledWith(mockClient);
      expect(result).toBe(mockTransaction);
    });
  });

  describe('freezeWithPayer', () => {
    it('should freeze the transaction with the payer account', () => {
      const mockTransaction = {
        setNodeAccountIds: jest.fn().mockReturnThis(),
        setTransactionId: jest.fn().mockReturnThis(),
        freeze: jest.fn().mockReturnThis(),
      } as unknown as Transaction;
      const payerAccount = '0.0.1234';

      const result = service.freezeWithPayer(mockTransaction, payerAccount);

      expect(mockTransaction.setNodeAccountIds).toHaveBeenCalledWith([
        new AccountId(3),
      ]);
      expect(mockTransaction.setTransactionId).toHaveBeenCalledWith(
        expect.any(TransactionId),
      );
      expect(mockTransaction.freeze).toHaveBeenCalled();
      expect(result).toBe(mockTransaction);
    });
  });

  describe('freezeSignExecuteAndGetReceipt', () => {
    it('should freeze, sign, execute, and get receipt of a transaction', async () => {
      const mockTransaction = {
        execute: jest.fn().mockResolvedValue({
          getReceipt: jest.fn().mockResolvedValue({}),
        }),
        sign: jest.fn().mockResolvedValue(undefined),
        isFrozen: jest.fn().mockReturnValue(true),
        freezeWith: jest.fn().mockReturnThis(),
      } as unknown as Transaction;
      const mockClient = {} as Client;
      const mockSigners = [PrivateKey.generate(), PrivateKey.generate()];

      const result = await service.freezeSignExecuteAndGetReceipt(
        mockTransaction,
        mockClient,
        mockSigners,
      );

      expect(mockTransaction.freezeWith).toHaveBeenCalledWith(mockClient);
      expect(mockTransaction.sign).toHaveBeenCalledTimes(mockSigners.length);
      expect(mockTransaction.execute).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual({});
    });
  });

  describe('addSigners', () => {
    it('should add signers to a frozen transaction', async () => {
      const mockTransaction = {
        sign: jest.fn().mockResolvedValue(undefined),
        isFrozen: jest.fn().mockReturnValue(true),
      } as unknown as Transaction;
      const mockSigners = [PrivateKey.generate(), PrivateKey.generate()];

      await service.addSigners(mockTransaction, mockSigners);

      expect(mockTransaction.sign).toHaveBeenCalledTimes(mockSigners.length);
    });

    it('should throw an error if the transaction is not frozen', async () => {
      const mockTransaction = {
        isFrozen: jest.fn().mockReturnValue(false),
      } as unknown as Transaction;
      const mockSigners = [PrivateKey.generate(), PrivateKey.generate()];

      await expect(
        service.addSigners(mockTransaction, mockSigners),
      ).rejects.toThrow(
        "Transaction is not frozen. You must freeze a transaction before calling 'addSigners'.",
      );
    });
  });
});
