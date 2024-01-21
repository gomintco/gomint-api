import { Test, TestingModule } from '@nestjs/testing';
import { KeyService } from './key.service';
import { Repository } from 'typeorm';
import { Key } from './key.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { KeyType } from '../app.interface';

// test for ecsda key creation
// test for ed25519 key creation
// test for encyrption of private key and decryption

const mockRepository = {
  create: jest.fn().mockImplementation((entity) => entity),
  // Add other necessary mock methods here
};

describe('KeyService', () => {
  let service: KeyService;
  let keyRepository: Repository<Key>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KeyService,
        {
          provide: getRepositoryToken(Key),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<KeyService>(KeyService);
    // keyRepository = module.get<Repository<Key>>(keyRepositoryToken);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    // expect(keyRepository).toBeDefined();
  });

  it('should create an ED25519 key successfully', async () => {
    const escrowKey = 'some-encryption-key';
    const keyBuilder = service.create(escrowKey, KeyType.ED25519);
    expect(keyBuilder).toBeDefined();
    expect(keyBuilder.type).toBe('ed25519');
  });

  it('should create an ECDSA key successfully', async () => {
    const escrowKey = 'some-encryption-key';
    const keyBuilder = service.create(escrowKey, KeyType.ECDSA);
    expect(keyBuilder).toBeDefined();
    expect(keyBuilder.type).toBe('ecdsa');
  });

  it('should encrypt and decrypt a string correctly', () => {
    const testString = 'Hello, World!';
    const encryptionKey = 'my-secret-key';
    const encrypted = service.encryptString(testString, encryptionKey);
    const decrypted = service.decryptString(encrypted, encryptionKey);
    expect(encrypted).not.toBe(testString);
    expect(decrypted).toBe(testString);
  });
});
