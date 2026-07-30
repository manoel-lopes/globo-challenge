import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const getLogFileByIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export class GetLogFileByIdParamsDto extends createZodDto(getLogFileByIdParamsSchema) {}
