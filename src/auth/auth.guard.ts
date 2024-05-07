import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from './constants';
import { AuthService } from './auth.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers['authorization'].split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  // canActivate(
  //   context: ExecutionContext,
  // ): boolean | Promise<boolean> | Observable<boolean> {
  //   const request = context.switchToHttp().getRequest();
  //   const { authorization } = request.headers;

  //   const [type, base64] = authorization.split(' ');

  //   switch (type) {
  //     case 'Basic':
  //       return this.handleBasicAuth(base64);
  //     case 'Bearer':
  //       return this.handleBearerAuth(base64);
  //     default:
  //       return false;
  //   }
  // }

  // private async handleBasicAuth(base64: string): Promise<boolean> {
  //   console.log('Handling basic auth');
  //   const [id] = Buffer.from(base64, 'base64').toString('ascii').split(':');
  //   try {
  //     await this.userService.findOneByOrFail(id);
  //     // maybe can have an encrypted known message here
  //     // decrypt with password and check if it matches
  //     return true;
  //   } catch (err) {
  //     throw new NotFoundException('User not found', {
  //       cause: err,
  //       description: err.code || err.message,
  //     });
  //     return false;
  //   }
  // }

  // private handleBearerAuth(base64: string) {
  //   return false;
  // }
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];
    if (!apiKey) {
      throw new UnauthorizedException('API Key is required');
    }
    const user = await this.authService.validateApiKey(apiKey);
    if (!user) {
      throw new UnauthorizedException('Invalid API Key');
    } // throws error in service if api key doesn't exist
    request['user'] = user;
    return true;
  }
}
