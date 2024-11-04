import { Repository } from 'typeorm';
import { KeyType } from './key-type.enum';
import { KeyService } from './key.service';
import { Mocked, TestBed } from '@suites/unit';
import { Key } from './key.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('KeyService', () => {
  let service: KeyService;
  let keysRepository: Mocked<Repository<Key>>;

  beforeEach(async () => {
    const { unit, unitRef } = await TestBed.solitary(KeyService).compile();
    service = unit;
    keysRepository = unitRef.get(String(getRepositoryToken(Key)));
    keysRepository.create.mockImplementationOnce((entity) => entity as Key);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create an ED25519 key successfully', async () => {
    const escrowKey = 'some-encryption-key';
    const keyBuilder = service.create(escrowKey, KeyType.ED25519);
    expect(keyBuilder).toBeDefined();
    expect(keyBuilder.type).toBe(KeyType.ED25519);
  });

  it('should create an ECDSA key successfully', async () => {
    const escrowKey = 'some-encryption-key';
    const keyBuilder = service.create(escrowKey, KeyType.ECDSA);
    expect(keyBuilder).toBeDefined();
    expect(keyBuilder.type).toBe(KeyType.ECDSA);
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
