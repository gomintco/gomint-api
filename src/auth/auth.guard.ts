import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UserService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const { authorization } = request.headers;

    const [type, base64] = authorization.split(' ');

    switch (type) {
      case 'Basic':
        return this.handleBasicAuth(base64);
      case 'Bearer':
        return this.handleBearerAuth(base64);
      default:
        return false;
    }
  }

  private async handleBasicAuth(base64: string): Promise<boolean> {
    console.log('Handling basic auth');
    const [id] = Buffer.from(base64, 'base64').toString('ascii').split(':');
    try {
      await this.userService.findOneByOrFail(id);
      // maybe can have an encrypted known message here
      // decrypt with password and check if it matches
      return true;
    } catch (err) {
      throw new NotFoundException('User not found', {
        cause: err,
        description: err.code || err.message,
      });
      return false;
    }
  }

  private handleBearerAuth(base64: string) {
    return false;
  }
}
