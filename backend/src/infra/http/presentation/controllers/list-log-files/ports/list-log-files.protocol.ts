import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const listLogFilesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
})

export class ListLogFilesQueryDto extends createZodDto(listLogFilesQuerySchema) {}
