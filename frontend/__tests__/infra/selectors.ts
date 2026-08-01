import type { CursorPage } from '@/core/domain/entities/cursor-page'
import type { DashboardSummary } from '@/core/domain/entities/dashboard-summary'
import type { TrendBucket } from '@/core/domain/entities/dashboard-trends'
import type { LogEntry, LogLevel } from '@/core/domain/entities/log-entry'
import type { OffsetPage } from '@/core/domain/entities/offset-page'
import type { TopSource } from '@/core/domain/entities/top-source'
import { isErrorLevel, LOG_LEVEL_ORDER } from '@/util/log-level'

export interface EntryFilterQuery {
  logFileId?: string
  level?: LogLevel[]
  from?: string
  to?: string
  q?: string
}

function inRange(timestamp: string, from?: string, to?: string): boolean {
  const time = new Date(timestamp).getTime()
  if (from && time < new Date(from).getTime()) return false
  if (to && time > new Date(to).getTime()) return false
  return true
}

export function filterLogEntries(entries: LogEntry[], query: EntryFilterQuery): LogEntry[] {
  return entries.filter((entry) => {
    if (query.logFileId && entry.logFileId !== query.logFileId) return false
    if (query.level && query.level.length > 0 && !query.level.includes(entry.level)) return false
    if (!inRange(entry.timestamp, query.from, query.to)) return false
    if (query.q) {
      const needle = query.q.toLowerCase()
      const haystack = `${entry.message} ${entry.rawLine}`.toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  })
}

export function sortByTimestamp(entries: LogEntry[], order: 'asc' | 'desc' = 'desc'): LogEntry[] {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  )
  return order === 'desc' ? sorted.reverse() : sorted
}

export function paginateCursor(
  entries: LogEntry[],
  cursor: string | undefined,
  limit: number,
): CursorPage<LogEntry> {
  const start = cursor ? Number.parseInt(cursor, 10) : 0
  const safeStart = Number.isFinite(start) && start >= 0 ? start : 0
  const items = entries.slice(safeStart, safeStart + limit)
  const nextIndex = safeStart + items.length
  const nextCursor = nextIndex < entries.length ? String(nextIndex) : null
  return { items, nextCursor, limit }
}

export function paginateOffset<TItem>(
  items: TItem[],
  page: number,
  pageSize: number,
  order: 'asc' | 'desc',
): OffsetPage<TItem> {
  const ordered = order === 'asc' ? [...items].reverse() : items
  const totalItems = ordered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const start = (page - 1) * pageSize
  return {
    page,
    pageSize,
    totalItems,
    totalPages,
    items: ordered.slice(start, start + pageSize),
    order,
  }
}

export function computeSummary(entries: LogEntry[]): DashboardSummary {
  const countsByLevel = Object.fromEntries(
    LOG_LEVEL_ORDER.map((level) => [level, 0]),
  ) as Record<LogLevel, number>
  const sources = new Set<string>()
  const files = new Set<string>()
  for (const entry of entries) {
    countsByLevel[entry.level] += 1
    if (entry.source) sources.add(entry.source)
    files.add(entry.logFileId)
  }
  return {
    totalEntries: entries.length,
    countsByLevel,
    distinctSources: sources.size,
    filesProcessed: files.size,
  }
}

function bucketKey(timestamp: string, bucket: 'hour' | 'day'): string {
  const date = new Date(timestamp)
  if (bucket === 'hour') date.setUTCMinutes(0, 0, 0)
  else date.setUTCHours(0, 0, 0, 0)
  return date.toISOString()
}

export function computeTrends(
  entries: LogEntry[],
  bucket: 'hour' | 'day',
  splitByLevel: boolean,
): TrendBucket[] {
  const buckets = new Map<string, TrendBucket>()
  for (const entry of entries) {
    const key = bucketKey(entry.timestamp, bucket)
    let point = buckets.get(key)
    if (!point) {
      point = { bucket: key, total: 0, countsByLevel: splitByLevel ? {} : undefined }
      buckets.set(key, point)
    }
    point.total += 1
    if (splitByLevel && point.countsByLevel) {
      point.countsByLevel[entry.level] = (point.countsByLevel[entry.level] ?? 0) + 1
    }
  }
  return [...buckets.values()].sort(
    (a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime(),
  )
}

export function computeTopSources(
  entries: LogEntry[],
  by: 'volume' | 'errorRate',
  limit: number,
): TopSource[] {
  const bySource = new Map<string, { total: number; errorCount: number }>()
  for (const entry of entries) {
    if (!entry.source) continue
    const stats = bySource.get(entry.source) ?? { total: 0, errorCount: 0 }
    stats.total += 1
    if (isErrorLevel(entry.level)) stats.errorCount += 1
    bySource.set(entry.source, stats)
  }
  const sources: TopSource[] = [...bySource.entries()].map(([source, stats]) => ({
    source,
    total: stats.total,
    errorCount: stats.errorCount,
    errorRate: stats.total > 0 ? stats.errorCount / stats.total : 0,
  }))
  sources.sort((a, b) => (by === 'volume' ? b.total - a.total : b.errorRate - a.errorRate))
  return sources.slice(0, limit)
}
