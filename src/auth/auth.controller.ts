import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { JwtGuard } from './auth.guard';
import { WrongPasswordError } from './error/wrong-password.error';
import { UserNotFoundError } from './error/user-not-found.error';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';

@Controller('auth')
export class AuthController {
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
    } catch (err) {
      switch (true) {
        case err instanceof WrongPasswordError:
          throw new UnauthorizedException();
        case err instanceof UserNotFoundError:
          throw new NotFoundException(err.message, err.options);
        default:
          console.error(err);
          throw new InternalServerErrorException();
      }
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
