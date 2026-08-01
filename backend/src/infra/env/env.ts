import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().optional().default(3333),
  DB_HOST: z.string().optional().default('localhost'),
  DB_PORT: z.coerce.number().optional().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),
  DB_POOL_MAX: z.coerce.number().optional().default(10),
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z.coerce.number().optional().default(6379),
  REDIS_DB: z.coerce.number().optional().default(0),
  MAX_UPLOAD_SIZE: z.coerce.number().optional().default(52_428_800),
  LOG_SYNC_MAX_BYTES: z.coerce.number().optional().default(1_048_576),
  UPLOAD_TEMP_DIR: z.string().optional(),
  LOG_QUEUE_DRIVER: z.enum(['inline', 'bullmq']).optional().default('inline'),
  LOG_QUEUE_CONCURRENCY: z.coerce.number().optional().default(1),
  LOG_QUEUE_ATTEMPTS: z.coerce.number().optional().default(3),
  CACHE_TTL_SECONDS: z.coerce.number().optional().default(60),
  ENABLE_SWAGGER: z.stringbool().optional(),
}).transform((env) => ({
  ...env,
  ENABLE_SWAGGER: env.ENABLE_SWAGGER ?? env.NODE_ENV !== 'production',
}))

export type Env = z.infer<typeof envSchema>
