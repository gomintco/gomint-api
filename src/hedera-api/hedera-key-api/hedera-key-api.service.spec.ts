import { Test, TestingModule } from '@nestjs/testing';
import { HederaKeyApiService } from './hedera-key-api.service';
import { AppConfigService } from 'src/config/app-config.service';
import { PrivateKey, KeyList } from '@hashgraph/sdk';
import { KeyType } from './key-type.enum';
import { Network } from '../network.enum';

describe('HederaKeyApiService', () => {
  let service: HederaKeyApiService;
  let configService: AppConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HederaKeyApiService,
        {
          provide: AppConfigService,
          useValue: {
            hedera: {
              testnet: { custodialKey: PrivateKey.generateED25519() },
              mainnet: { custodialKey: PrivateKey.generateED25519() },
            },
          },
        },
      ],
    }).compile();

    service = module.get<HederaKeyApiService>(HederaKeyApiService);
    configService = module.get<AppConfigService>(AppConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateED25519', () => {
    it('should generate a valid ED25519 PrivateKey', () => {
      const privateKey = service.generateED25519();
      expect(privateKey).toBeInstanceOf(PrivateKey);
      expect(privateKey.publicKey).toBeDefined();
    });
  });

  describe('generateECDSA', () => {
    it('should generate a valid ECDSA PrivateKey', () => {
      const privateKey = service.generateECDSA();
      expect(privateKey).toBeInstanceOf(PrivateKey);
      expect(privateKey.publicKey).toBeDefined();
    });
  });

  describe('generatePrivateKey', () => {
    it('should generate an ED25519 PrivateKey when type is ED25519', () => {
      const privateKey = service.generatePrivateKey(KeyType.ED25519);
      expect(privateKey).toBeInstanceOf(PrivateKey);
      expect(privateKey.publicKey).toBeDefined();
    });

    it('should generate an ECDSA PrivateKey when type is ECDSA', () => {
      const privateKey = service.generatePrivateKey(KeyType.ECDSA);
      expect(privateKey).toBeInstanceOf(PrivateKey);
      expect(privateKey.publicKey).toBeDefined();
    });

    it('should throw an error for unsupported key type', () => {
      expect(() => service.generatePrivateKey('unsupported' as KeyType)).toThrowError('Unsupported key type');
    });
  });

  describe('generateKeyList', () => {
    it('should generate a KeyList with the correct number of._keys', () => {
      const keyList = service.generateKeyList(3, KeyType.ED25519);
      expect(keyList).toBeInstanceOf(KeyList);
      expect(keyList._keys.length).toBe(3);
    });

    it('should generate a KeyList with a threshold if provided', () => {
      const threshold = 2;
      const keyList = service.generateKeyList(3, KeyType.ED25519, threshold);
      expect(keyList.threshold).toBe(threshold);
    });
  });

  describe('generateGoMintKeyList', () => {
    it('should generate a KeyList with the custodial key from the testnet config', () => {
      const { keyList, privateKey } = service.generateGoMintKeyList(KeyType.ED25519, Network.TESTNET);
      expect(keyList).toBeInstanceOf(KeyList);
      expect(keyList._keys.length).toBe(2);
      expect(keyList._keys[1]).toBe(configService.hedera.testnet.custodialKey);
      expect(privateKey).toBeInstanceOf(PrivateKey);
    });

    it('should generate a KeyList with the custodial key from the mainnet config', () => {
      const { keyList, privateKey } = service.generateGoMintKeyList(KeyType.ED25519, Network.MAINNET);
      expect(keyList).toBeInstanceOf(KeyList);
      expect(keyList._keys.length).toBe(2);
      expect(keyList._keys[1]).toBe(configService.hedera.mainnet.custodialKey);
      expect(privateKey).toBeInstanceOf(PrivateKey);
    });
  });
});
