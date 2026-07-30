import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const dashboardFilterQuerySchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  logFileId: z.string().uuid().optional(),
})

export class DashboardFilterQueryDto extends createZodDto(dashboardFilterQuerySchema) {}

export const dashboardTrendsQuerySchema = dashboardFilterQuerySchema.extend({
  bucket: z.enum(['hour', 'day']).optional().default('hour'),
  splitByLevel: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .optional()
    .transform((value) => value === true || value === 'true'),
})

export class DashboardTrendsQueryDto extends createZodDto(dashboardTrendsQuerySchema) {}

export const dashboardTopSourcesQuerySchema = dashboardFilterQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  by: z.enum(['volume', 'errorRate']).optional().default('volume'),
})

export class DashboardTopSourcesQueryDto extends createZodDto(dashboardTopSourcesQuerySchema) {}
