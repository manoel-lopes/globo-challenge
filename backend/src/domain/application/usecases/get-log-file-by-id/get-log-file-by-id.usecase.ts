import { Inject, Injectable } from '@nestjs/common'
import { UseCase } from '@/core/domain/application/use-case'
import { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import type { LogFile } from '@/domain/enterprise/entities/log-file.entity'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'

type GetLogFileByIdRequest = {
  id: string
}

@Injectable()
export class GetLogFileByIdUseCase implements UseCase {
  constructor (
    @Inject(LogFilesRepository) private readonly logFilesRepository: LogFilesRepository
  ) {}

  async execute (req: GetLogFileByIdRequest): Promise<LogFile> {
    const logFile = await this.logFilesRepository.findById(req.id)
    if (!logFile) {
      throw new ResourceNotFoundError('LogFile')
    }
    return logFile
  }
}
