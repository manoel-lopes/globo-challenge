import { Inject, Injectable } from '@nestjs/common'
import { UseCase } from '@/core/domain/application/use-case'
import type { DashboardTrends } from '@/domain/application/repositories/log-entries.repository'
import { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'

type GetDashboardTrendsRequest = {
  bucket?: 'hour' | 'day'
  from?: string
  to?: string
  splitByLevel?: boolean
  logFileId?: string
}

@Injectable()
export class GetDashboardTrendsUseCase implements UseCase {
  constructor (
    @Inject(LogEntriesRepository) private readonly logEntriesRepository: LogEntriesRepository
  ) {}

  async execute (req: GetDashboardTrendsRequest = {}): Promise<DashboardTrends> {
    return this.logEntriesRepository.getTrends({
      bucket: req.bucket ?? 'hour',
      from: req.from ? new Date(req.from) : undefined,
      to: req.to ? new Date(req.to) : undefined,
      splitByLevel: req.splitByLevel ?? false,
      logFileId: req.logFileId,
    })
  }
}
