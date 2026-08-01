import { z } from 'zod'

const envSchema = z.object({
  VITE_API_URL: z.url().default('http://localhost:3333'),
})

function getValidatedEnv() {
  const result = envSchema.safeParse(import.meta.env)
  if (result.success) return result.data

  const { fieldErrors } = z.flattenError(result.error)
  console.error('\n\x1b[1m\x1b[31mInvalid environment variables:\x1b[0m')
  Object.keys(fieldErrors).forEach((key) => console.error(`- ${key} is invalid`))
  throw new Error('Invalid environment variables')
}

export const env = getValidatedEnv()
