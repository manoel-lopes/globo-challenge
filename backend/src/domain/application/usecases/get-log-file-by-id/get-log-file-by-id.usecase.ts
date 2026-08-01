import type { UseCase } from '@/core/domain/application/use-case'
import type { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import type { LogFile } from '@/domain/enterprise/entities/log-file/log-file.entity'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'

type GetLogFileByIdRequest = {
  id: string
}

export class GetLogFileByIdUseCase implements UseCase {
  constructor (private readonly logFilesRepository: LogFilesRepository) {}

  async execute (req: GetLogFileByIdRequest): Promise<LogFile> {
    const logFile = await this.logFilesRepository.findById(req.id)
    if (!logFile) {
      throw new ResourceNotFoundError('LogFile')
    }
    return logFile
  }
}
