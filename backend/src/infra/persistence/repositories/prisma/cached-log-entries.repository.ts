import type Redis from 'ioredis'
import { Inject, Injectable } from '@nestjs/common'
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
import { REDIS_CLIENT } from '@/infra/cache/cache.module'
import { BaseCachedRepository } from '@/infra/cache/repositories/base/base-cached.repository'
import { EnvService } from '@/infra/env/env.service'
import { PrismaLogEntriesRepository } from '@/infra/persistence/repositories/prisma/prisma-log-entries.repository'
import type { LogEntry } from '@/domain/enterprise/entities/log-entry/log-entry.entity'

const DASHBOARD_GEN_KEY = 'dashboard:gen'

@Injectable()
export class CachedLogEntriesRepository
  extends BaseCachedRepository
  implements LogEntriesRepository {
  constructor (
    @Inject(REDIS_CLIENT) redis: Redis,
    private readonly prismaRepository: PrismaLogEntriesRepository,
    private readonly envService: EnvService
  ) {
    super(redis)
  }

  createMany (entries: LogEntryCreateInput[]): Promise<number> {
    return this.prismaRepository.createMany(entries)
  }

  async deleteManyByLogFileId (logFileId: string): Promise<number> {
    return this.prismaRepository.deleteManyByLogFileId(logFileId).then(async (count) => {
      await this.invalidateDashboardCache()
      return count
    })
  }

  async invalidateDashboardCache (): Promise<void> {
    await this.redis.incr(DASHBOARD_GEN_KEY)
  }

  findById (id: string): Promise<LogEntry | null> {
    return this.prismaRepository.findById(id)
  }

  findMany (
    filter: LogEntriesFilter,
    params: PaginationParams
  ): Promise<PaginatedItems<LogEntry>> {
    return this.prismaRepository.findMany(filter, params)
  }

  findManyByCursor (
    filter: LogEntriesFilter,
    params: CursorPaginationParams
  ): Promise<CursorPaginatedItems<LogEntry>> {
    return this.prismaRepository.findManyByCursor(filter, params)
  }

  async getSummary (
    filter: Pick<LogEntriesFilter, 'from' | 'to' | 'logFileId'> = {}
  ): Promise<DashboardSummary> {
    const key = await this.dashboardKey('summary', filter)
    const cached = await this.getFromCache<DashboardSummary>(key)
    if (cached) return cached
    const summary = await this.prismaRepository.getSummary(filter)
    await this.setCache(key, summary, this.envService.get('CACHE_TTL_SECONDS'))
    return summary
  }

  async getTrends (params: {
    bucket: 'hour' | 'day'
    from?: Date
    to?: Date
    splitByLevel?: boolean
    logFileId?: string
  }): Promise<DashboardTrends> {
    const key = await this.dashboardKey('trends', params)
    const cached = await this.getFromCache<DashboardTrends>(key)
    if (cached) {
      return {
        ...cached,
        series: cached.series.map((item) => ({
          ...item,
          bucket: new Date(item.bucket),
        })),
      }
    }
    const trends = await this.prismaRepository.getTrends(params)
    await this.setCache(key, trends, this.envService.get('CACHE_TTL_SECONDS'))
    return trends
  }

  async getTopSources (params: {
    limit?: number
    by?: 'volume' | 'errorRate'
    from?: Date
    to?: Date
    logFileId?: string
  }): Promise<TopSource[]> {
    const key = await this.dashboardKey('top-sources', params)
    const cached = await this.getFromCache<TopSource[]>(key)
    if (cached) return cached
    const sources = await this.prismaRepository.getTopSources(params)
    await this.setCache(key, sources, this.envService.get('CACHE_TTL_SECONDS'))
    return sources
  }

  private async dashboardKey (segment: string, payload: unknown): Promise<string> {
    const gen = await this.currentGeneration()
    return `dashboard:v${gen}:${segment}:${JSON.stringify(payload)}`
  }

  private async currentGeneration (): Promise<string> {
    const gen = await this.redis.get(DASHBOARD_GEN_KEY)
    return gen ?? '0'
  }
}
