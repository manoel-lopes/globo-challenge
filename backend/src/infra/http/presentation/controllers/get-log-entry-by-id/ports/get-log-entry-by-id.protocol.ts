import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const getLogEntryByIdParamsSchema = z.object({
  id: z.string().uuid(),
})

export class GetLogEntryByIdParamsDto extends createZodDto(getLogEntryByIdParamsSchema) {}
