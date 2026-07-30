import { Inject, Injectable } from '@nestjs/common'
import { UseCase } from '@/core/domain/application/use-case'
import type { DashboardSummary } from '@/domain/application/repositories/log-entries.repository'
import { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'

type GetDashboardSummaryRequest = {
  from?: string
  to?: string
  logFileId?: string
}

@Injectable()
export class GetDashboardSummaryUseCase implements UseCase {
  constructor (
    @Inject(LogEntriesRepository) private readonly logEntriesRepository: LogEntriesRepository
  ) {}

  async execute (req: GetDashboardSummaryRequest = {}): Promise<DashboardSummary> {
    return this.logEntriesRepository.getSummary({
      from: req.from ? new Date(req.from) : undefined,
      to: req.to ? new Date(req.to) : undefined,
      logFileId: req.logFileId,
    })
  }
}
