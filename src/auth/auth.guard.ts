import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from './jwt-payload.type';
import { AppConfigService } from 'src/config/app-config.service';
import { ENCRYPTION_KEY_HEADER } from 'src/core/headers.const';
import { API_KEY_HEADER, AUTHORIZATION_HEADER } from 'src/core/headers.const';
import { ApiKeyService } from './api-key.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(req);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      req.payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.app.jwtSecret,
      });
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(req: Request): string | undefined {
    const [type, token] = req.headers[AUTHORIZATION_HEADER].split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const apiKey = req.headers[API_KEY_HEADER];
    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }
    req.user = await this.apiKeyService.validateApiKey(apiKey);
    return true;
  }
}

@Injectable()
export class EncryptionKeyGuard implements CanActivate {
  constructor() {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const headers = ctx.switchToHttp().getRequest().headers;
    const encryptionKey = headers[ENCRYPTION_KEY_HEADER];

    if (!encryptionKey) {
      throw new UnauthorizedException('Encryption Key is required');
    }

    return true;
  }
}
