declare module 'jsonwebtoken' {
  /**
   * @property username - username of the subject
   * @property sub (subject): Subject of the JWT (user ID)
   * @property exp (expiration time): Time after which the JWT expires
   * @property iat (issued at time): Time at which the JWT was issued; can be used to determine age of the JWT
   */
  interface JwtPayload {
    username: string;
    sub: string;
    exp?: number;
    iat?: number;
  }
}
