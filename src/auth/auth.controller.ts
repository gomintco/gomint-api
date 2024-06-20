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
} from '@nestjs/common';
import { SignInDto } from './dto/sign-in.dto';
import { AuthService } from './auth.service';
import { ApiKeyGuard, JwtGuard } from './auth.guard';
import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { handleEndpointErrors } from 'src/core/endpoint-error-handler';
import { UserNotFoundError } from 'src/core/error';
import { SignUpDto } from 'src/auth/dto/sign-up.dto';
import { UserService } from 'src/user/user.service';
import { UserResponse } from 'src/user/response/user.response';
import { AuthMediator } from './auth.mediator';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly mediator: AuthMediator,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('signup')
  async create(@Body() signUpDto: SignUpDto) {
    try {
      const { username, id, network } = await this.mediator.register(signUpDto);

      return { username, id, network };
    } catch (error: any) {
      handleEndpointErrors(this.logger, error, []);
    }
  }

  @UseGuards(ApiKeyGuard)
  @Get()
  async getUser(@Req() req: Request): Promise<UserResponse> {
    const { id: userId } = req.user;
    const user = await this.userService.getUser(userId);
    return new UserResponse(user);
  }

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
