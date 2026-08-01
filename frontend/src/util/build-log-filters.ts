import type { LogLevel } from '@/core/domain/entities/log-entry'

export interface LogsFilters {
  level?: LogLevel[]
  from?: string
  to?: string
  q?: string
  logFileId?: string
}

interface LogsQueryParams {
  level?: string
  from?: string
  to?: string
  q?: string
  logFileId?: string
  cursor?: string
  limit: number
  order: 'asc' | 'desc'
}

export function buildLogFilterParams(filters: LogsFilters, cursor?: string): LogsQueryParams {
  const params: LogsQueryParams = { limit: 100, order: 'desc' }
  if (filters.level && filters.level.length > 0) params.level = filters.level.join(',')
  if (filters.from) params.from = filters.from
  if (filters.to) params.to = filters.to
  if (filters.q) params.q = filters.q
  if (filters.logFileId) params.logFileId = filters.logFileId
  if (cursor) params.cursor = cursor
  return params
}
