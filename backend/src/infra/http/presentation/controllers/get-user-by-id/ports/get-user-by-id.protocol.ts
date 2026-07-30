import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const getUserByIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export class GetUserByIdParamsDto extends createZodDto(getUserByIdParamsSchema) {}
