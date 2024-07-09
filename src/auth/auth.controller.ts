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
import { SignInDto } from './dto/sign-in.dto';
import { JwtGuard, JwtOrApiKeyGuard } from './auth.guard';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';
import {
  ApiKeyNotFound,
  UserDuplicationError,
  UserNotFoundError,
} from 'src/core/error';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { UserResponse } from 'src/user/response/user.response';
import { AuthMediator } from './auth.mediator';
import { ApiKeyResponse } from './response/api-key.response';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authMediator: AuthMediator) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() signUpDto: SignUpDto) {
    try {
      const { username, id, network } =
        await this.authMediator.signup(signUpDto);

      return { username, id, network };
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [UserDuplicationError], toThrow: BadRequestException },
      ]);
    }
  }

  @Get('user')
  @UseGuards(JwtGuard)
  async getAuthUser(@Req() req: Request): Promise<UserResponse> {
    return this.authMediator.getAuthUser(req.user.id);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<{ access_token: string }> {
    try {
      return await this.authMediator.signIn(
        signInDto.username,
        signInDto.hashedPassword,
      );
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [UserNotFoundError], toThrow: NotFoundException },
      ]);
    }
  }

  @Post('api-key')
  @UseGuards(JwtGuard)
  async createApiKey(@Req() req: Request): Promise<{ apiKey: string }> {
    return this.authMediator.generateApiKey(req.payload.sub);
  }

  @Get('api-key')
  @UseGuards(JwtOrApiKeyGuard)
  async getApiKeys(
    @Req() req: Request,
  ): Promise<{ apiKeys: ApiKeyResponse[] }> {
    try {
      const userId = req.payload?.sub ?? req.user?.id;
      const apiKeys = await this.authMediator.getApiKeys(userId);
      const responseApiKeys = apiKeys.map(
        (apiKey) => new ApiKeyResponse(apiKey),
      );
      return { apiKeys: responseApiKeys };
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
      return await this.authMediator.deleteApiKey(
        req.payload.sub,
        Number(apiKeyId),
      );
    } catch (error) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [ApiKeyNotFound], toThrow: NotFoundException },
      ]);
    }
  }

  @Get('profile')
  @UseGuards(JwtGuard)
  getProfile(@Req() req: Request): JwtPayload {
    return req.payload;
  }
}
