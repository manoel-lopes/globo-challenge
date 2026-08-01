import type { UseCase } from '@/core/domain/application/use-case'
import type {
  DashboardSummary,
  LogEntriesRepository,
} from '@/domain/application/repositories/log-entries.repository'

type GetDashboardSummaryRequest = {
  from?: string
  to?: string
  logFileId?: string
}

export class GetDashboardSummaryUseCase implements UseCase {
  constructor (private readonly logEntriesRepository: LogEntriesRepository) {}

  async execute (req: GetDashboardSummaryRequest = {}): Promise<DashboardSummary> {
    return this.logEntriesRepository.getSummary({
      from: req.from ? new Date(req.from) : undefined,
      to: req.to ? new Date(req.to) : undefined,
      logFileId: req.logFileId,
    })
  }
}
