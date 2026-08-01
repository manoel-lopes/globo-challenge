import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { PaginationParams } from '@/core/domain/application/pagination-params'
import type { LogEntry, LogLevel } from '@/domain/enterprise/entities/log-entry/log-entry.entity'

export type LogEntryCreateInput = {
  logFileId: string
  level: LogLevel
  timestamp: Date
  source?: string | null
  message: string
  rawLine: string
  metadata?: Record<string, unknown> | null
}

export type LogEntriesFilter = {
  level?: LogLevel[]
  from?: Date
  to?: Date
  q?: string
  logFileId?: string
}

export type CursorPaginationParams = {
  cursor?: string
  limit?: number
  order?: 'asc' | 'desc'
}

export type CursorPaginatedItems<Item> = {
  items: Item[]
  nextCursor: string | null
  limit: number
}

export type DashboardSummary = {
  totalEntries: number
  countsByLevel: Record<LogLevel, number>
  distinctSources: number
  filesProcessed: number
}

export type DashboardTrendBucket = {
  bucket: Date
  total: number
  countsByLevel?: Partial<Record<LogLevel, number>>
}

export type DashboardTrends = {
  bucket: 'hour' | 'day'
  series: DashboardTrendBucket[]
}

export type TopSource = {
  source: string
  total: number
  errorCount: number
  errorRate: number
}

export type LogEntriesRepository = {
  createMany(entries: LogEntryCreateInput[]): Promise<number>
  findById(id: string): Promise<LogEntry | null>
  findMany(
    filter: LogEntriesFilter,
    params: PaginationParams
  ): Promise<PaginatedItems<LogEntry>>
  findManyByCursor(
    filter: LogEntriesFilter,
    params: CursorPaginationParams
  ): Promise<CursorPaginatedItems<LogEntry>>
  getSummary(filter?: Pick<LogEntriesFilter, 'from' | 'to' | 'logFileId'>): Promise<DashboardSummary>
  getTrends(params: {
    bucket: 'hour' | 'day'
    from?: Date
    to?: Date
    splitByLevel?: boolean
    logFileId?: string
  }): Promise<DashboardTrends>
  getTopSources(params: {
    limit?: number
    by?: 'volume' | 'errorRate'
    from?: Date
    to?: Date
    logFileId?: string
  }): Promise<TopSource[]>
}

export const LogEntriesRepository = Symbol('LogEntriesRepository')
