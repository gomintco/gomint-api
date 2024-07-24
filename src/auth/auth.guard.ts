import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AppConfigService } from 'src/config/app-config.service';
import { ENCRYPTION_KEY_HEADER } from 'src/core/headers.const';
import { API_KEY_HEADER, AUTHORIZATION_HEADER } from 'src/core/headers.const';
import { ApiKeyService } from './api-key.service';

@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: AppConfigService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(req);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      req.payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.app.jwtSecret,
      });
    } catch (error: any) {
      this.logger.error(error);
      if (error.message === 'jwt expired') {
        throw new UnauthorizedException('Session is expired');
      }
      throw new UnauthorizedException('Session token is corrupted');
    }
    return true;
  }

  private extractToken(req: Request): string | undefined {
    const [type, token] = req.headers[AUTHORIZATION_HEADER]?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeyService: ApiKeyService) { }
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
  constructor() { }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const headers = ctx.switchToHttp().getRequest().headers;
    const encryptionKey = headers[ENCRYPTION_KEY_HEADER];

    if (!encryptionKey) {
      throw new UnauthorizedException('Encryption Key is required');
    }

    return true;
  }
}

@Injectable()
export class JwtOrApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(JwtOrApiKeyGuard.name);
  private readonly guards: CanActivate[];

  constructor(jwtGuard: JwtGuard, apiKeyGuard: ApiKeyGuard) {
    this.guards = [jwtGuard, apiKeyGuard];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    for (const guard of this.guards) {
      try {
        const canActivate = await guard.canActivate(context);
        if (canActivate) {
          return true;
        }
      } catch (error) {
        this.logger.error(error);
      }
    }
    throw new UnauthorizedException('Session token or API key is required');
  }
}
