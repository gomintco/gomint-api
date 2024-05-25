import { Env, envSchema } from './env.schema';

export function validate(config: Record<string, unknown>): Env {
  try {
    return envSchema.parse(config);
  } catch (error) {
    console.error('Failed to validate environmental variables');
    throw new Error(error.toString());
  }
}
