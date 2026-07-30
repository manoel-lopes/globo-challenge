import { Inject, Injectable } from '@nestjs/common'
import { UseCase } from '@/core/domain/application/use-case'
import type { TopSource } from '@/domain/application/repositories/log-entries.repository'
import { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'

type GetDashboardTopSourcesRequest = {
  limit?: number
  by?: 'volume' | 'errorRate'
  from?: string
  to?: string
  logFileId?: string
}

@Injectable()
export class GetDashboardTopSourcesUseCase implements UseCase {
  constructor (
    @Inject(LogEntriesRepository) private readonly logEntriesRepository: LogEntriesRepository
  ) {}

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
