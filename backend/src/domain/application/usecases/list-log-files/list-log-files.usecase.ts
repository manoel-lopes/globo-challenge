import { Inject, Injectable } from '@nestjs/common'
import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { PaginationParams } from '@/core/domain/application/pagination-params'
import { UseCase } from '@/core/domain/application/use-case'
import { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import type { LogFile } from '@/domain/enterprise/entities/log-file/log-file.entity'

type ListLogFilesRequest = PaginationParams

@Injectable()
export class ListLogFilesUseCase implements UseCase {
  constructor (
    @Inject(LogFilesRepository) private readonly logFilesRepository: LogFilesRepository
  ) {}

  async execute (req: ListLogFilesRequest = {}): Promise<PaginatedItems<LogFile>> {
    return this.logFilesRepository.findMany({
      page: req.page ?? 1,
      pageSize: req.pageSize ?? 10,
      order: req.order ?? 'desc',
    })
  }
}
