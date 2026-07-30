import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const listLogsQuerySchema = z.object({
  level: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().optional(),
  logFileId: z.string().uuid().optional(),
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  order: z.enum(['asc', 'desc']).optional(),
})

export class ListLogsQueryDto extends createZodDto(listLogsQuerySchema) {}
