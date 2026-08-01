import type { UseCase } from '@/core/domain/application/use-case'
import type {
  LogEntriesRepository,
  TopSource,
} from '@/domain/application/repositories/log-entries.repository'

type GetDashboardTopSourcesRequest = {
  limit?: number
  by?: 'volume' | 'errorRate'
  from?: string
  to?: string
  logFileId?: string
}

export class GetDashboardTopSourcesUseCase implements UseCase {
  constructor (private readonly logEntriesRepository: LogEntriesRepository) {}

  async execute (req: GetDashboardTopSourcesRequest = {}): Promise<TopSource[]> {
    return this.logEntriesRepository.getTopSources({
      limit: req.limit ?? 10,
      by: req.by ?? 'volume',
      from: req.from ? new Date(req.from) : undefined,
      to: req.to ? new Date(req.to) : undefined,
      logFileId: req.logFileId,
    })
  }
}
