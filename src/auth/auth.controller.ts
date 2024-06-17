import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  UnauthorizedException,
  NotFoundException,
  Req,
  Logger,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { JwtGuard } from './auth.guard';
import { WrongPasswordError } from './error/wrong-password.error';
import { UserNotFoundError } from './error/user-not-found.error';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(
    @Body() signInDto: SignInDto,
  ): Promise<{ access_token: string }> {
    try {
      return await this.authService.signIn(
        signInDto.username,
        signInDto.hashedPassword,
      );
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, [
        { errorTypes: [WrongPasswordError], toThrow: UnauthorizedException },
        { errorTypes: [UserNotFoundError], toThrow: NotFoundException },
      ]);
    }
  }

  @UseGuards(JwtGuard)
  @Post('/api-key')
  async createApiKey(@Req() req: Request): Promise<{ apiKey: string }> {
    return this.authService.generateApiKey(req.payload.sub);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@Req() req: Request): JwtPayload {
    return req.payload;
  }
}
