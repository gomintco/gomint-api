import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  NotFoundException,
  Req,
  Logger,
  BadRequestException,
  Delete,
  Param,
} from '@nestjs/common';
import { SignInDto, SignUpDto } from './dto';
import { JwtGuard, JwtOrApiKeyGuard } from './auth.guard';
import { Request } from 'express';
import { handleEndpointErrors } from '../core/endpoint-error-handler';
import {
  ApiKeyNotFound,
  UserDuplicationError,
  UserNotFoundError,
} from '../core/error';
import { UserResponse } from '../user/response/user.response';
import { AuthMediator } from './auth.mediator';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiKeyCreateResponse,
  ApiKeysResponse,
  SignInResponse,
  SignUpResponse,
} from './response';
import { ProfileResponse } from './response/profile.response';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authMediator: AuthMediator) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signUpDto: SignUpDto): Promise<SignUpResponse> {
    try {
      const user = await this.authMediator.signup(signUpDto);

      return new SignUpResponse(user);
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [UserDuplicationError], toThrow: BadRequestException },
      ]);
    }
  }

  @Get('user')
  @UseGuards(JwtGuard)
  async getAuthUser(@Req() req: Request): Promise<UserResponse> {
    const userId = req.payload.sub;
    return this.authMediator.getAuthUser(userId);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto): Promise<SignInResponse> {
    try {
      const accessToken = await this.authMediator.signIn(
        signInDto.username,
        signInDto.hashedPassword,
      );

      return new SignInResponse(accessToken);
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [UserNotFoundError], toThrow: NotFoundException },
      ]);
    }
  }

  @Post('api-key')
  @UseGuards(JwtGuard)
  async createApiKey(@Req() req: Request): Promise<ApiKeyCreateResponse> {
    const apiKey = await this.authMediator.generateApiKey(req.payload.sub);
    return new ApiKeyCreateResponse(apiKey.key);
  }

  @Get('api-key')
  @UseGuards(JwtOrApiKeyGuard)
  async getApiKeys(@Req() req: Request): Promise<ApiKeysResponse> {
    try {
      const userId = req.payload?.sub ?? req.user?.id;
      const apiKeys = await this.authMediator.getApiKeys(userId);
      return new ApiKeysResponse(apiKeys);
    } catch (error) {
      handleEndpointErrors(this.logger, error, []);
    }
  }

  @Delete('api-key/:apiKeyId')
  @UseGuards(JwtOrApiKeyGuard)
  async deleteApiKey(
    @Req() req: Request,
    @Param('apiKeyId') apiKeyId: string,
  ): Promise<void> {
    try {
      const userId = req.payload?.sub ?? req.user?.id;
      return await this.authMediator.deleteApiKey(userId, Number(apiKeyId));
    } catch (error) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [ApiKeyNotFound], toThrow: NotFoundException },
      ]);
    }
  }

  @Get('profile')
  @UseGuards(JwtGuard)
  getProfile(@Req() req: Request): ProfileResponse {
    return new ProfileResponse(req.payload);
  }
}
