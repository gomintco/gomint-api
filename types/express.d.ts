import { JwtPayload } from 'src/auth/jwt-payload.type';
import { User } from 'src/user/user.entity';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    payload?: JwtPayload;
  }
}
