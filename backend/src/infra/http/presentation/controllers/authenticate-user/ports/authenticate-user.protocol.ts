import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const authenticateUserBodySchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export class AuthenticateUserBodyDto extends createZodDto(authenticateUserBodySchema) {}
