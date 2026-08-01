import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { UseCase } from '@/core/domain/application/use-case'
import type {
  CursorPaginatedItems,
  LogEntriesFilter,
  LogEntriesRepository,
} from '@/domain/application/repositories/log-entries.repository'
import type { LogEntry, LogLevel } from '@/domain/enterprise/entities/log-entry/log-entry.entity'

export type ListLogEntriesRequest = {
  level?: string
  from?: string
  to?: string
  q?: string
  logFileId?: string
  cursor?: string
  limit?: number
  page?: number
  pageSize?: number
  order?: 'asc' | 'desc'
}

export type ListLogEntriesResponse =
  | CursorPaginatedItems<LogEntry>
  | PaginatedItems<LogEntry>

const LOG_LEVELS: Record<LogLevel, true> = {
  TRACE: true,
  DEBUG: true,
  INFO: true,
  WARN: true,
  ERROR: true,
  FATAL: true,
  UNKNOWN: true,
}

function isLogLevel (value: string): value is LogLevel {
  return Object.hasOwn(LOG_LEVELS, value)
}

export class ListLogEntriesUseCase implements UseCase {
  constructor (private readonly logEntriesRepository: LogEntriesRepository) {}

  async execute (req: ListLogEntriesRequest = {}): Promise<ListLogEntriesResponse> {
    const filter = this.buildFilter(req)
    const useOffset = req.page !== undefined || req.pageSize !== undefined
    if (useOffset) {
      return this.logEntriesRepository.findMany(filter, {
        page: req.page ?? 1,
        pageSize: req.pageSize ?? 20,
        order: req.order ?? 'desc',
      })
    }
    return this.logEntriesRepository.findManyByCursor(filter, {
      cursor: req.cursor,
      limit: req.limit ?? 50,
      order: req.order ?? 'desc',
    })
  }

  private buildFilter (req: ListLogEntriesRequest): LogEntriesFilter {
    return {
      level: this.parseLevels(req.level),
      from: req.from ? new Date(req.from) : undefined,
      to: req.to ? new Date(req.to) : undefined,
      q: req.q,
      logFileId: req.logFileId,
    }
  }

  private parseLevels (level?: string): LogLevel[] | undefined {
    if (!level) return undefined
    return level
      .split(',')
      .map((item) => item.trim().toUpperCase())
      .filter(isLogLevel)
  }
}
