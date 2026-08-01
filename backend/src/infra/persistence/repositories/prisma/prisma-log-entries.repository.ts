import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
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
import { formatPagination } from '@/infra/persistence/helpers/format-pagination.helper'
import { PrismaLogEntryMapper } from '@/infra/persistence/mappers/prisma-log-entry.mapper'
import { PrismaService } from '@/infra/persistence/prisma.service'
import type { LogEntry, LogLevel } from '@/domain/enterprise/entities/log-entry/log-entry.entity'

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

function toJsonValue (value: Record<string, unknown>): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value))
}

@Injectable()
export class PrismaLogEntriesRepository implements LogEntriesRepository {
  constructor (private readonly prisma: PrismaService) {}

  async createMany (entries: LogEntryCreateInput[]): Promise<number> {
    if (entries.length === 0) return 0
    const result = await this.prisma.logEntry.createMany({
      data: entries.map((entry) => ({
        logFileId: entry.logFileId,
        level: entry.level,
        timestamp: entry.timestamp,
        source: entry.source ?? null,
        message: entry.message,
        rawLine: entry.rawLine,
        metadata: entry.metadata === null || entry.metadata === undefined
          ? Prisma.JsonNull
          : toJsonValue(entry.metadata),
      })),
    })
    return result.count
  }

  async deleteManyByLogFileId (logFileId: string): Promise<number> {
    const result = await this.prisma.logEntry.deleteMany({
      where: { logFileId },
    })
    return result.count
  }

  async invalidateDashboardCache (): Promise<void> {}

  async findById (id: string): Promise<LogEntry | null> {
    const entry = await this.prisma.logEntry.findUnique({ where: { id } })
    return entry ? this.toDomain(entry) : null
  }

  async findMany (
    filter: LogEntriesFilter,
    params: PaginationParams
  ): Promise<PaginatedItems<LogEntry>> {
    const { page, pageSize, skip, take } = formatPagination(
      params.page ?? 1,
      params.pageSize ?? 20
    )
    const order = params.order ?? 'desc'
    const where = this.buildWhere(filter)
    const [items, totalItems] = await this.prisma.$transaction([
      this.prisma.logEntry.findMany({
        where,
        skip,
        take,
        orderBy: [{ timestamp: order }, { id: order }],
      }),
      this.prisma.logEntry.count({ where }),
    ])
    return {
      page,
      pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      items: items.map((item) => this.toDomain(item)),
      order,
    }
  }

  async findManyByCursor (
    filter: LogEntriesFilter,
    params: CursorPaginationParams
  ): Promise<CursorPaginatedItems<LogEntry>> {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 100)
    const order = params.order ?? 'desc'
    const where = this.buildWhere(filter)
    if (params.cursor) {
      const cursorEntry = await this.prisma.logEntry.findUnique({
        where: { id: params.cursor },
        select: { id: true, timestamp: true },
      })
      if (cursorEntry) {
        where.AND = [
          ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
          this.buildCursorCondition(cursorEntry, order),
        ]
      }
    }
    const items = await this.prisma.logEntry.findMany({
      where,
      take: limit + 1,
      orderBy: [{ timestamp: order }, { id: order }],
    })
    const hasMore = items.length > limit
    const pageItems = hasMore ? items.slice(0, limit) : items
    const nextCursor = hasMore ? pageItems[pageItems.length - 1]?.id ?? null : null
    return {
      items: pageItems.map((item) => this.toDomain(item)),
      nextCursor,
      limit,
    }
  }

  async getSummary (
    filter: Pick<LogEntriesFilter, 'from' | 'to' | 'logFileId'> = {}
  ): Promise<DashboardSummary> {
    const where = this.buildWhere(filter)
    const sourceConditions = [
      Prisma.sql`source IS NOT NULL`,
      ...this.buildRawConditions(filter),
    ]
    const [totalEntries, grouped, distinctSourcesRows, filesProcessed] = await Promise.all([
      this.prisma.logEntry.count({ where }),
      this.prisma.logEntry.groupBy({
        by: ['level'],
        where,
        _count: { _all: true },
      }),
      this.prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
        SELECT COUNT(DISTINCT source)::bigint AS count
        FROM log_entries
        WHERE ${Prisma.join(sourceConditions, ' AND ')}
      `),
      this.prisma.logFile.count({
        where: {
          status: 'COMPLETED',
          ...(filter.logFileId ? { id: filter.logFileId } : {}),
        },
      }),
    ])
    const countsByLevel = emptyCountsByLevel()
    for (const group of grouped) {
      countsByLevel[group.level] = group._count._all
    }
    return {
      totalEntries,
      countsByLevel,
      distinctSources: Number(distinctSourcesRows[0]?.count ?? 0),
      filesProcessed,
    }
  }

  async getTrends (params: {
    bucket: 'hour' | 'day'
    from?: Date
    to?: Date
    splitByLevel?: boolean
    logFileId?: string
  }): Promise<DashboardTrends> {
    const truncUnit = params.bucket === 'hour' ? 'hour' : 'day'
    const conditions = this.buildRawConditions(params)
    const whereClause = conditions.length > 0
      ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
      : Prisma.empty
    if (params.splitByLevel) {
      const rows = await this.prisma.$queryRaw<Array<{
        bucket: Date
        level: LogLevel
        total: bigint
      }>>(Prisma.sql`
        SELECT date_trunc(${truncUnit}, "timestamp") AS bucket,
               level,
               COUNT(*)::bigint AS total
        FROM log_entries
        ${whereClause}
        GROUP BY bucket, level
        ORDER BY bucket ASC
      `)
      const seriesMap = new Map<string, DashboardTrends['series'][number]>()
      for (const row of rows) {
        const key = row.bucket.toISOString()
        const existing = seriesMap.get(key) ?? {
          bucket: row.bucket,
          total: 0,
          countsByLevel: {},
        }
        const count = Number(row.total)
        existing.total += count
        existing.countsByLevel = {
          ...existing.countsByLevel,
          [row.level]: count,
        }
        seriesMap.set(key, existing)
      }
      return {
        bucket: params.bucket,
        series: Array.from(seriesMap.values()),
      }
    }
    const rows = await this.prisma.$queryRaw<Array<{
      bucket: Date
      total: bigint
    }>>(Prisma.sql`
      SELECT date_trunc(${truncUnit}, "timestamp") AS bucket,
             COUNT(*)::bigint AS total
      FROM log_entries
      ${whereClause}
      GROUP BY bucket
      ORDER BY bucket ASC
    `)
    return {
      bucket: params.bucket,
      series: rows.map((row) => ({
        bucket: row.bucket,
        total: Number(row.total),
      })),
    }
  }

  async getTopSources (params: {
    limit?: number
    by?: 'volume' | 'errorRate'
    from?: Date
    to?: Date
    logFileId?: string
  }): Promise<TopSource[]> {
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 100)
    const conditions = [
      Prisma.sql`source IS NOT NULL`,
      ...this.buildRawConditions(params),
    ]
    const orderBy = params.by === 'errorRate'
      ? Prisma.sql`ORDER BY (CASE WHEN total = 0 THEN 0 ELSE error_count::float8 / total END) DESC, total DESC`
      : Prisma.sql`ORDER BY total DESC`
    const rows = await this.prisma.$queryRaw<Array<{
      source: string
      total: bigint
      error_count: bigint
    }>>(Prisma.sql`
      SELECT * FROM (
        SELECT source,
               COUNT(*)::bigint AS total,
               COUNT(*) FILTER (WHERE level IN ('ERROR', 'FATAL'))::bigint AS error_count
        FROM log_entries
        WHERE ${Prisma.join(conditions, ' AND ')}
        GROUP BY source
      ) AS agg
      ${orderBy}
      LIMIT ${limit}
    `)
    return rows.map((row) => {
      const total = Number(row.total)
      const errorCount = Number(row.error_count)
      return {
        source: row.source,
        total,
        errorCount,
        errorRate: total === 0 ? 0 : errorCount / total,
      }
    })
  }

  private buildRawConditions (filter: {
    from?: Date
    to?: Date
    logFileId?: string
  }): Prisma.Sql[] {
    const conditions: Prisma.Sql[] = []
    if (filter.from) conditions.push(Prisma.sql`"timestamp" >= ${filter.from}`)
    if (filter.to) conditions.push(Prisma.sql`"timestamp" <= ${filter.to}`)
    if (filter.logFileId) conditions.push(Prisma.sql`"logFileId" = ${filter.logFileId}`)
    return conditions
  }

  private buildCursorCondition (
    cursor: { id: string, timestamp: Date },
    order: 'asc' | 'desc'
  ): Prisma.LogEntryWhereInput {
    const beyond = order === 'asc' ? 'gt' : 'lt'
    return {
      OR: [
        { timestamp: { [beyond]: cursor.timestamp } },
        { timestamp: cursor.timestamp, id: { [beyond]: cursor.id } },
      ],
    }
  }

  private buildWhere (filter: LogEntriesFilter): Prisma.LogEntryWhereInput {
    const where: Prisma.LogEntryWhereInput = {}
    if (filter.level?.length) {
      where.level = { in: filter.level }
    }
    if (filter.logFileId) {
      where.logFileId = filter.logFileId
    }
    if (filter.from || filter.to) {
      where.timestamp = {
        ...(filter.from ? { gte: filter.from } : {}),
        ...(filter.to ? { lte: filter.to } : {}),
      }
    }
    if (filter.q) {
      where.OR = [
        { message: { contains: filter.q, mode: 'insensitive' } },
        { rawLine: { contains: filter.q, mode: 'insensitive' } },
      ]
    }
    return where
  }

  private toDomain (entry: {
    id: string
    logFileId: string
    level: LogLevel
    timestamp: Date
    source: string | null
    message: string
    rawLine: string
    metadata: Prisma.JsonValue | null
    createdAt: Date
    updatedAt: Date
  }): LogEntry {
    return PrismaLogEntryMapper.toDomain(entry)
  }
}
