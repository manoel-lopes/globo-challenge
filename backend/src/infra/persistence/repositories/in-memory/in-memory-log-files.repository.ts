import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { PaginationParams } from '@/core/domain/application/pagination-params'
import type {
  LogFileCreateInput,
  LogFileProgressUpdate,
  LogFilesRepository,
} from '@/domain/application/repositories/log-files.repository'
import type { LogFile } from '@/domain/enterprise/entities/log-file.entity'
import { BaseInMemoryRepository as BaseRepository } from './base/base-in-memory.repository'

export class InMemoryLogFilesRepository
  extends BaseRepository<LogFile>
  implements LogFilesRepository {
  async create (data: LogFileCreateInput): Promise<LogFile> {
    return super.create({
      filename: data.filename,
      status: data.status ?? 'PENDING',
      checksum: null,
      sizeBytes: null,
      totalLines: 0,
      processedLines: 0,
      failedLines: 0,
      processedAt: null,
    })
  }

  async findDuplicateByChecksum (checksum: string): Promise<LogFile | null> {
    return this.items.find(
      (item) => item.checksum === checksum && item.status !== 'FAILED'
    ) ?? null
  }

  async findMany (params: PaginationParams): Promise<PaginatedItems<LogFile>> {
    return this.findManyItems(params)
  }

  async update (id: string, data: LogFileProgressUpdate): Promise<LogFile> {
    return this.updateOne({ entityId: id, data })
  }

  async count (): Promise<number> {
    return this.items.length
  }
}
