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
import { AuthService } from './auth.service';
import { ApiKeyGuard, JwtGuard } from './auth.guard';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';
import { UserDuplicationError, UserNotFoundError } from 'src/core/error';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { UserResponse } from 'src/user/response/user.response';
import { AuthMediator } from './auth.mediator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly service: AuthService,
    private readonly mediator: AuthMediator,
  ) { }

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async signup(@Body() signUpDto: SignUpDto) {
    try {
      const { username, id, network } = await this.mediator.signup(signUpDto);

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
    return this.mediator.getAuthUser(req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<{ access_token: string }> {
    try {
      return await this.service.signIn(
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
  @Post('/api-key')
  async createApiKey(@Req() req: Request): Promise<{ apiKey: string }> {
    return this.service.generateApiKey(req.payload.sub);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@Req() req: Request): JwtPayload {
    return req.payload;
  }
}
