import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { JwtGuard } from './auth.guard';
import { WrongPasswordError } from './error/wrong-password.error';
import { UserNotFoundError } from './error/user-not-found.error';
// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  async signIn(@Body() signInDto: SignInDto) {
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
          // you can pass err into this exception so that error message will be visible
          throw new InternalServerErrorException();
      }
    }
  }

  @UseGuards(JwtGuard)
  // @Post(':userId/api-keys')
  // async createApiKey(@Param('userId') userId: string, @Request() req) {
  @Post('/api-key')
  async createApiKey(@Request() req) {
    // Ensure the authenticated user is the same as userId

    // is this needed? - the jwt is unique anyway...
    // if (req.user.sub !== userId) {
    //   throw new ForbiddenException();
    // }

    return this.authService.generateApiKey(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
