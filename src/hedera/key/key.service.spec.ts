import { Test, TestingModule } from '@nestjs/testing';
import { HederaKeyService } from './key.service';
import { KeyType } from './key-type.enum';
import { PrivateKey, KeyList } from '@hashgraph/sdk';

describe('HederaKeyService', () => {
  let service: HederaKeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HederaKeyService],
    }).compile();

    service = module.get<HederaKeyService>(HederaKeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate ED25519 private key', () => {
    const key = service.generateED25519();
    expect(key).toBeInstanceOf(PrivateKey);
  });

  it('should generate ECDSA private key', () => {
    const key = service.generateECDSA();
    expect(key).toBeInstanceOf(PrivateKey);
  });

  it('should generate private key of type ED25519', () => {
    const key = service.generatePrivateKey(KeyType.ED25519);
    expect(key).toBeInstanceOf(PrivateKey);
  });

  it('should generate private key of type ECDSA', () => {
    const key = service.generatePrivateKey(KeyType.ECDSA);
    expect(key).toBeInstanceOf(PrivateKey);
  });

  it('should throw an error for unsupported key type', () => {
    expect(() => service.generatePrivateKey(-1 as unknown as KeyType)).toThrow(
      'Unsupported key type',
    );
  });

  it('should generate a KeyList with the specified number of keys', () => {
    const n = 3;
    const keyList = service.generateKeyList(n, KeyType.ED25519);
    expect(keyList).toBeInstanceOf(KeyList);
    expect(keyList._keys.length).toBe(n);
  });

  it('should generate a KeyList with the specified threshold', () => {
    const n = 3;
    const threshold = 2;
    const keyList = service.generateKeyList(n, KeyType.ED25519, threshold);
    expect(keyList).toBeInstanceOf(KeyList);
    expect(keyList._keys.length).toBe(n);
    expect(keyList.threshold).toBe(threshold);
  });
});
