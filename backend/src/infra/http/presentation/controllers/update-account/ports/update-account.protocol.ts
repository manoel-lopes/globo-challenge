import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const updateAccountBodySchema = z.object({
  name: z.string().min(1).optional(),
  email: z.email().optional(),
  password: z
    .string()
    .min(6)
    .max(12)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/,
      'The password must contain at least one uppercase and one lowercase letter, one number and one ' +
      'special character'
    )
    .optional(),
})

export class UpdateAccountBodyDto extends createZodDto(updateAccountBodySchema) {}
