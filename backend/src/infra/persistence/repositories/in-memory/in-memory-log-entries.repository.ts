import { randomUUID } from 'node:crypto'
import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { PaginationParams } from '@/core/domain/application/pagination-params'
import type {
  CursorPaginatedItems,
  CursorPaginationParams,
  DashboardSummary,
  DashboardTrends,
  LogEntriesFilter,
  LogEntriesRepository,
  LogEntryCreateInput,
  TopSource,
} from '@/domain/application/repositories/log-entries.repository'
import type { LogEntry, LogLevel } from '@/domain/enterprise/entities/log-entry.entity'
import { BaseInMemoryRepository as BaseRepository } from './base/base-in-memory.repository'

function emptyCountsByLevel (): Record<LogLevel, number> {
  return {
    TRACE: 0,
    DEBUG: 0,
    INFO: 0,
    WARN: 0,
    ERROR: 0,
    FATAL: 0,
    UNKNOWN: 0,
  }
}

export class InMemoryLogEntriesRepository
  extends BaseRepository<LogEntry>
  implements LogEntriesRepository {
  filesProcessed = 0

  async createMany (entries: LogEntryCreateInput[]): Promise<number> {
    for (const entry of entries) {
      const item: LogEntry = {
        id: randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
        logFileId: entry.logFileId,
        level: entry.level,
        timestamp: entry.timestamp,
        source: entry.source ?? null,
        message: entry.message,
        rawLine: entry.rawLine,
        metadata: entry.metadata ?? null,
      }
      this.items.push(item)
    }
    return entries.length
  }

  async findMany (
    filter: LogEntriesFilter,
    params: PaginationParams
  ): Promise<PaginatedItems<LogEntry>> {
    const filtered = this.applyFilter(filter)
    const order = params.order ?? 'desc'
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 20
    const sorted = filtered.sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime()
      if (diff !== 0) return order === 'asc' ? diff : -diff
      return order === 'asc'
        ? a.id.localeCompare(b.id)
        : b.id.localeCompare(a.id)
    })
    const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)
    return {
      page,
      pageSize,
      totalItems: filtered.length,
      totalPages: Math.ceil(filtered.length / pageSize),
      items: pageItems,
      order,
    }
  }

  async findManyByCursor (
    filter: LogEntriesFilter,
    params: CursorPaginationParams
  ): Promise<CursorPaginatedItems<LogEntry>> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 100)
    const order = params.order ?? 'desc'
    let filtered = this.applyFilter(filter)
    filtered = filtered.sort((a, b) => {
      const diff = a.timestamp.getTime() - b.timestamp.getTime()
      if (diff !== 0) return order === 'asc' ? diff : -diff
      return order === 'asc'
        ? a.id.localeCompare(b.id)
        : b.id.localeCompare(a.id)
    })
    if (params.cursor) {
      const cursorIndex = filtered.findIndex((item) => item.id === params.cursor)
      if (cursorIndex >= 0) {
        filtered = filtered.slice(cursorIndex + 1)
      }
    }
    const pageItems = filtered.slice(0, limit)
    const hasMore = filtered.length > limit
    return {
      items: pageItems,
      nextCursor: hasMore ? pageItems[pageItems.length - 1]?.id ?? null : null,
      limit,
    }
  }

  async getSummary (
    filter: Pick<LogEntriesFilter, 'from' | 'to' | 'logFileId'> = {}
  ): Promise<DashboardSummary> {
    const filtered = this.applyFilter(filter)
    const countsByLevel = emptyCountsByLevel()
    const sources = new Set<string>()
    for (const entry of filtered) {
      countsByLevel[entry.level] += 1
      if (entry.source) sources.add(entry.source)
    }
    return {
      totalEntries: filtered.length,
      countsByLevel,
      distinctSources: sources.size,
      filesProcessed: this.filesProcessed,
    }
  }

  async getTrends (params: {
    bucket: 'hour' | 'day'
    from?: Date
    to?: Date
    splitByLevel?: boolean
    logFileId?: string
  }): Promise<DashboardTrends> {
    const filtered = this.applyFilter({
      from: params.from,
      to: params.to,
      logFileId: params.logFileId,
    })
    const seriesMap = new Map<string, DashboardTrends['series'][number]>()
    for (const entry of filtered) {
      const bucketDate = this.truncate(entry.timestamp, params.bucket)
      const key = bucketDate.toISOString()
      const existing = seriesMap.get(key) ?? {
        bucket: bucketDate,
        total: 0,
        countsByLevel: params.splitByLevel ? {} : undefined,
      }
      existing.total += 1
      if (params.splitByLevel && existing.countsByLevel) {
        existing.countsByLevel[entry.level] = (existing.countsByLevel[entry.level] ?? 0) + 1
      }
      seriesMap.set(key, existing)
    }
    return {
      bucket: params.bucket,
      series: Array.from(seriesMap.values()).sort(
        (a, b) => a.bucket.getTime() - b.bucket.getTime()
      ),
    }
  }

  async getTopSources (params: {
    limit?: number
    by?: 'volume' | 'errorRate'
    from?: Date
    to?: Date
    logFileId?: string
  }): Promise<TopSource[]> {
    const filtered = this.applyFilter({
      from: params.from,
      to: params.to,
      logFileId: params.logFileId,
    }).filter((entry): entry is LogEntry & { source: string } => typeof entry.source === 'string')
    const map = new Map<string, TopSource>()
    for (const entry of filtered) {
      const source = entry.source
      const current = map.get(source) ?? {
        source,
        total: 0,
        errorCount: 0,
        errorRate: 0,
      }
      current.total += 1
      if (entry.level === 'ERROR' || entry.level === 'FATAL') {
        current.errorCount += 1
      }
      current.errorRate = current.total === 0 ? 0 : current.errorCount / current.total
      map.set(source, current)
    }
    const sources = Array.from(map.values())
    const sorted = params.by === 'errorRate'
      ? sources.sort((a, b) => b.errorRate - a.errorRate || b.total - a.total)
      : sources.sort((a, b) => b.total - a.total)
    return sorted.slice(0, params.limit ?? 10)
  }

  private applyFilter (filter: LogEntriesFilter): LogEntry[] {
    return this.items.filter((entry) => {
      if (filter.logFileId && entry.logFileId !== filter.logFileId) return false
      if (filter.level?.length && !filter.level.includes(entry.level)) return false
      if (filter.from && entry.timestamp < filter.from) return false
      if (filter.to && entry.timestamp > filter.to) return false
      if (filter.q) {
        const q = filter.q.toLowerCase()
        const matchesMessage = entry.message.toLowerCase().includes(q)
        const matchesRaw = entry.rawLine.toLowerCase().includes(q)
        if (!matchesMessage && !matchesRaw) return false
      }
      return true
    })
  }

  private truncate (date: Date, bucket: 'hour' | 'day'): Date {
    const result = new Date(date)
    result.setUTCMilliseconds(0)
    result.setUTCSeconds(0)
    result.setUTCMinutes(0)
    if (bucket === 'day') {
      result.setUTCHours(0)
    }
    return result
  }
}
