import { Env } from 'src/config/env.schema';

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Env {}
  }
}
