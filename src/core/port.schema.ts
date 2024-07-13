import { z } from 'zod';

export const portSchema = z.string().min(1).transform(parsePort);

function parsePort(val: string, ctx: z.RefinementCtx) {
  const parsed = parseInt(val);
  if (isNaN(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not a number',
    });
    return z.NEVER;
  }
  if (parsed < 0 || parsed > 65535) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Not in a range',
    });
    return z.NEVER;
  }
  return parsed;
}
