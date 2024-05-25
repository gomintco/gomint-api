import { z } from 'zod';
import { NodeEnv } from './node-env.enum';
import { portSchema } from 'src/util/parse-port';

export const envSchema = z.object({
  // APP
  NODE_ENV: z.nativeEnum(NodeEnv),
  PORT: portSchema,
  JWT_SECRET: z.string().min(1),

  // DB
  DB_HOST: z.string().url().or(z.literal('localhost')),
  DB_PORT: portSchema,
  DB_USERNAME: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),

  // HEDERA
  TESTNET_ID: z.string().min(1),
  TESTNET_KEY: z.string().min(1),
  MAINNET_ID: z.string().min(1),
  MAINNET_KEY: z.string().min(1),
  TESTNET_MIRRORNODE_URL: z.string().url(),
  MAINNET_MIRRORNODE_URL: z.string().url(),
  PREVIEWNET_MIRRORNODE_URL: z.string().url(),
});

export type Env = z.infer<typeof envSchema>;
