import { User } from 'src/user/user.entity';
import { JwtPayload } from 'jsonwebtoken';

declare module 'express-serve-static-core' {
  interface Request {
    user?: User;
    payload?: JwtPayload;
  }
}
