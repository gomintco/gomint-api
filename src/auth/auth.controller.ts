import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { JwtGuard } from './auth.guard';
// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }

  @UseGuards(JwtGuard)
  @Post(':userId/api-keys')
  async createApiKey(@Param('userId') userId: string, @Request() req) {
    // Ensure the authenticated user is the same as userId
    if (req.user.sub !== userId) {
      throw new ForbiddenException();
    }

    return this.authService.generateApiKey(req.user.sub);
  }

  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
