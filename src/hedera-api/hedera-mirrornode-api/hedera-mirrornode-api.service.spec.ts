import { Test, TestingModule } from '@nestjs/testing';
import { HederaMirrornodeApiService } from './hedera-mirrornode-api.service';
import { AppConfigService } from 'src/config/app-config.service';
import { Network } from 'src/hedera-api/network.enum';
import { TokenMirrornodeInfo } from './hedera-mirrornode-api.interface';

describe('HederaMirrornodeApiService', () => {
  let service: HederaMirrornodeApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HederaMirrornodeApiService,
        {
          provide: AppConfigService,
          useValue: {
            hedera: {
              testnet: { mirrornodeUrl: 'https://testnet.mirrornode.url' },
              mainnet: { mirrornodeUrl: 'https://mainnet.mirrornode.url' },
            },
          },
        },
      ],
    }).compile();

    service = module.get<HederaMirrornodeApiService>(
      HederaMirrornodeApiService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTokenMirrornodeInfo', () => {
    it('should fetch token info from the testnet mirrornode', async () => {
      const network = Network.TESTNET;
      const tokenId = '0.0.12345';

      // Mock the fetch call
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          token_id: tokenId,
          name: 'Test Token',
        } as TokenMirrornodeInfo),
      });

      const result = await service.getTokenMirrornodeInfo(network, tokenId);

      expect(fetch).toHaveBeenCalledWith(
        'https://testnet.mirrornode.url/tokens/0.0.12345',
      );
      expect(result.token_id).toBe(tokenId);
      expect(result.name).toBe('Test Token');
    });

    it('should fetch token info from the mainnet mirrornode', async () => {
      const network = Network.MAINNET;
      const tokenId = '0.0.67890';

      // Mock the fetch call
      global.fetch = jest.fn().mockResolvedValue({
        json: jest.fn().mockResolvedValue({
          token_id: tokenId,
          name: 'Mainnet Token',
        } as TokenMirrornodeInfo),
      });

      const result = await service.getTokenMirrornodeInfo(network, tokenId);

      expect(fetch).toHaveBeenCalledWith(
        'https://mainnet.mirrornode.url/tokens/0.0.67890',
      );
      expect(result.token_id).toBe(tokenId);
      expect(result.name).toBe('Mainnet Token');
    });

    it('should throw an error if the network is not supported', async () => {
      const network = 'invalid-network' as Network;
      const tokenId = '0.0.67890';

      await expect(
        service.getTokenMirrornodeInfo(network, tokenId),
      ).rejects.toThrow();
    });
  });
});
