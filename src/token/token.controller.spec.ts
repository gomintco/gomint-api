import { mockLogger } from 'test/mocks/logger.mock';
mockLogger();
import { Test, TestingModule } from '@nestjs/testing';
import { TokenController } from './token.controller';
import { FtService } from './ft/ft.service';
import { NftService } from './nft/nft.service';
import { TokenService } from './token.service';
import { Request } from 'express';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { TokenCreateDto } from './dto/token-create.dto';
import { TokenMintDto } from './dto/token-mint.dto';
import { TokenAssociateDto } from './dto/token-associate.dto';
import {
  MintResponse,
  TokenAssociateResponse,
  TokenCreateResponse,
} from './response';
import { AccountNotFoundError, DecryptionFailedError } from 'src/core/error';
import { ApiKeyGuard } from 'src/auth/auth.guard';

describe('TokenController', () => {
  let tokenController: TokenController;
  let ftService: FtService;
  let nftService: NftService;
  let tokenService: TokenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokenController],
      providers: [
        {
          provide: FtService,
          useValue: {
            tokenCreateHandler: jest.fn(),
            tokenMintHandler: jest.fn(),
          },
        },
        {
          provide: NftService,
          useValue: {
            tokenCreateHandler: jest.fn(),
            tokenMintHandler: jest.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            tokenAssociateHandler: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(ApiKeyGuard)
      .useValue({
        canActivate: jest.fn(() => true),
      })
      .compile();

    tokenController = module.get<TokenController>(TokenController);
    ftService = module.get<FtService>(FtService);
    nftService = module.get<NftService>(NftService);
    tokenService = module.get<TokenService>(TokenService);
  });

  describe('create', () => {
    it('should create an FT token and return the token ID', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenCreateDto: TokenCreateDto = {
        tokenType: 'ft',
      } as TokenCreateDto;
      const mockTokenId = 'mockTokenId';
      jest
        .spyOn(ftService, 'tokenCreateHandler')
        .mockResolvedValue(mockTokenId);

      const result = await tokenController.create(req, tokenCreateDto);

      expect(ftService.tokenCreateHandler).toHaveBeenCalledWith(
        req.user,
        tokenCreateDto,
        undefined,
      );
      expect(result).toEqual(new TokenCreateResponse(mockTokenId));
    });

    it('should create an NFT token and return the token ID', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenCreateDto: TokenCreateDto = {
        tokenType: 'nft',
      } as TokenCreateDto;
      const mockTokenId = 'mockTokenId';
      jest
        .spyOn(nftService, 'tokenCreateHandler')
        .mockResolvedValue(mockTokenId);

      const result = await tokenController.create(req, tokenCreateDto);

      expect(nftService.tokenCreateHandler).toHaveBeenCalledWith(
        req.user,
        tokenCreateDto,
        undefined,
      );
      expect(result).toEqual(new TokenCreateResponse(mockTokenId));
    });

    it('should handle known errors and throw appropriate exceptions', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenCreateDto: TokenCreateDto = {
        tokenType: 'ft',
      } as TokenCreateDto;
      jest
        .spyOn(ftService, 'tokenCreateHandler')
        .mockRejectedValue(new DecryptionFailedError());

      await expect(tokenController.create(req, tokenCreateDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle unknown errors and throw InternalServerErrorException', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenCreateDto: TokenCreateDto = {
        tokenType: 'ft',
      } as TokenCreateDto;
      jest
        .spyOn(ftService, 'tokenCreateHandler')
        .mockRejectedValue(new Error('Unknown error'));

      await expect(tokenController.create(req, tokenCreateDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('mint', () => {
    it('should mint an FT token and return the status', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenMintDto: TokenMintDto = {
        tokenType: 'ft',
        amount: 10,
      } as TokenMintDto;
      const mockStatus = 'SUCCESS';
      jest.spyOn(ftService, 'tokenMintHandler').mockResolvedValue(mockStatus);

      const result = await tokenController.mint(req, tokenMintDto);

      expect(ftService.tokenMintHandler).toHaveBeenCalledWith(
        req.user,
        tokenMintDto,
        undefined,
      );
      expect(result).toEqual(new MintResponse(mockStatus));
    });

    it('should mint an NFT token and return the status', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenMintDto: TokenMintDto = {
        tokenType: 'nft',
        metadatas: ['metadata1'],
      } as TokenMintDto;
      const mockStatus = 'SUCCESS';
      jest.spyOn(nftService, 'tokenMintHandler').mockResolvedValue(mockStatus);

      const result = await tokenController.mint(req, tokenMintDto);

      expect(nftService.tokenMintHandler).toHaveBeenCalledWith(
        req.user,
        tokenMintDto,
        undefined,
      );
      expect(result).toEqual(new MintResponse(mockStatus));
    });

    it('should throw BadRequestException if FT minting amount is missing', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenMintDto: TokenMintDto = { tokenType: 'ft' } as TokenMintDto;

      await expect(tokenController.mint(req, tokenMintDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if NFT metadata and amount are missing', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenMintDto: TokenMintDto = {
        tokenType: 'nft',
        metadatas: [],
      } as TokenMintDto;

      await expect(tokenController.mint(req, tokenMintDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle errors during minting and throw ServiceUnavailableException', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenMintDto: TokenMintDto = {
        tokenType: 'ft',
        amount: 10,
      } as TokenMintDto;
      jest
        .spyOn(ftService, 'tokenMintHandler')
        .mockRejectedValue(new Error('Minting error'));

      await expect(tokenController.mint(req, tokenMintDto)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('associate', () => {
    it('should associate a token and return the status', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenAssociateDto: TokenAssociateDto = {
        associatingId: 'assocId',
      } as TokenAssociateDto;
      const mockStatus = 'SUCCESS';
      jest
        .spyOn(tokenService, 'tokenAssociateHandler')
        .mockResolvedValue(mockStatus);

      const result = await tokenController.associate(req, tokenAssociateDto);

      expect(tokenService.tokenAssociateHandler).toHaveBeenCalledWith(
        req.user,
        tokenAssociateDto,
        undefined,
      );
      expect(result).toEqual(new TokenAssociateResponse(mockStatus));
    });

    it('should handle AccountNotFoundError and throw NotFoundException', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenAssociateDto: TokenAssociateDto = {
        associatingId: 'assocId',
      } as TokenAssociateDto;
      jest
        .spyOn(tokenService, 'tokenAssociateHandler')
        .mockRejectedValue(new AccountNotFoundError());

      await expect(
        tokenController.associate(req, tokenAssociateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle unknown errors during association', async () => {
      const req = { user: { id: 'userId' } } as Request;
      const tokenAssociateDto: TokenAssociateDto = {
        associatingId: 'assocId',
      } as TokenAssociateDto;
      jest
        .spyOn(tokenService, 'tokenAssociateHandler')
        .mockRejectedValue(new Error('Unknown error'));

      await expect(
        tokenController.associate(req, tokenAssociateDto),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
