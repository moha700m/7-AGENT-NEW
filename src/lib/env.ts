import { z } from 'zod'

const optionalString = z.preprocess((value) => value === '' ? undefined : value, z.string().min(1).optional())
const optionalUrl = z.preprocess((value) => value === '' ? undefined : value, z.string().url().optional())

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  OPENAI_API_KEY: optionalString,
  OPENAI_MODEL: z.string().min(1).default('gpt-5.4-mini'),
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
})

export function validateServerEnv() { return serverEnvSchema.safeParse(process.env) }
