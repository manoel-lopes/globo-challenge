import type { UseCase } from '@/core/domain/application/use-case'
import type {
  DashboardTrends,
  LogEntriesRepository,
} from '@/domain/application/repositories/log-entries.repository'

type GetDashboardTrendsRequest = {
  bucket?: 'hour' | 'day'
  from?: string
  to?: string
  splitByLevel?: boolean
  logFileId?: string
}

export class GetDashboardTrendsUseCase implements UseCase {
  constructor (private readonly logEntriesRepository: LogEntriesRepository) {}

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
