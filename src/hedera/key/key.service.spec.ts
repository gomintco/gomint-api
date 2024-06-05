import { Test, TestingModule } from '@nestjs/testing';
import { KeyService } from './key.service';
import { PrivateKey } from '@hashgraph/sdk'; // Replace with actual import
import { KeyType } from './key-type.enum'; // Adjust if KeyType is in a different file

jest.mock('@hashgraph/sdk', () => ({
  PrivateKey: {
    generateED25519: jest.fn(),
    generateECDSA: jest.fn(),
  },
}));

describe('KeyService', () => {
  let service: KeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KeyService],
    }).compile();

    service = module.get<KeyService>(KeyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate ED25519 key', () => {
    const mockKey = {};
    (PrivateKey.generateED25519 as jest.Mock).mockReturnValue(mockKey);

    const result = service.generateED25519();

    expect(result).toBe(mockKey);
    expect(PrivateKey.generateED25519).toHaveBeenCalled();
  });

  it('should generate ECDSA key', () => {
    const mockKey = {};
    (PrivateKey.generateECDSA as jest.Mock).mockReturnValue(mockKey);

    const result = service.generateECDSA();

    expect(result).toBe(mockKey);
    expect(PrivateKey.generateECDSA).toHaveBeenCalled();
  });

  it('should generate key based on type - ED25519', () => {
    const mockKey = {};
    (PrivateKey.generateED25519 as jest.Mock).mockReturnValue(mockKey);

    const result = service.generatePrivateKey(KeyType.ED25519);

    expect(result).toBe(mockKey);
    expect(PrivateKey.generateED25519).toHaveBeenCalled();
  });

  it('should generate key based on type - ECDSA', () => {
    const mockKey = {};
    (PrivateKey.generateECDSA as jest.Mock).mockReturnValue(mockKey);

    const result = service.generatePrivateKey(KeyType.ECDSA);

    console.log(result);

    expect(result).toBe(mockKey);
    expect(PrivateKey.generateECDSA).toHaveBeenCalled();
  });

  //it('should throw error for unsupported key type', () => {
  //  expect(() => service.generatePrivateKey(999)).toThrowError('Unsupported key type');
  //});
});
