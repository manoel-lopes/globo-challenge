import type { UseCase } from '@/core/domain/application/use-case'
import type { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import type { LogEntry } from '@/domain/enterprise/entities/log-entry/log-entry.entity'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'

type GetLogEntryByIdRequest = {
  id: string
}

export class GetLogEntryByIdUseCase implements UseCase {
  constructor (private readonly logEntriesRepository: LogEntriesRepository) {}

  async execute (req: GetLogEntryByIdRequest): Promise<LogEntry> {
    const entry = await this.logEntriesRepository.findById(req.id)
    if (!entry) {
      throw new ResourceNotFoundError('LogEntry')
    }
    return entry
  }
}
