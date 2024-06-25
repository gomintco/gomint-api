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
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { ApiKeyGuard, JwtGuard } from './auth.guard';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';
import { UserDuplicationError, UserNotFoundError } from 'src/core/error';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { UserResponse } from 'src/user/response/user.response';
import { AuthMediator } from './auth.mediator';
import { ApiKeyResponse } from './response/api-key.response';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authMediator: AuthMediator) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
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

  @UseGuards(ApiKeyGuard)
  @Get('user')
  async getAuthUser(@Req() req: Request): Promise<UserResponse> {
    return this.authMediator.getAuthUser(req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
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

  @UseGuards(JwtGuard)
  @Post('api-key')
  async createApiKey(@Req() req: Request): Promise<{ apiKey: string }> {
    return this.authMediator.generateApiKey(req.payload.sub);
  }

  @UseGuards(JwtGuard)
  @Get('api-key')
  async getApiKeys(
    @Req() req: Request,
  ): Promise<{ apiKeys: ApiKeyResponse[] }> {
    try {
      const apiKeys = await this.authMediator.getApiKeys(req.payload.sub);
      return { apiKeys: apiKeys.map((apiKey) => new ApiKeyResponse(apiKey)) };
    } catch (error) {
      handleEndpointErrors(this.logger, error, []);
    }
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@Req() req: Request): JwtPayload {
    return req.payload;
  }
}
