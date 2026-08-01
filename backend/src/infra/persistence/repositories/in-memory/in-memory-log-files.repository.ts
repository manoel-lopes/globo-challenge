import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { PaginationParams } from '@/core/domain/application/pagination-params'
import type {
  LogFileCreateInput,
  LogFileProgressUpdate,
  LogFilesRepository,
} from '@/domain/application/repositories/log-files.repository'
import { ChecksumConflictError } from '@/domain/application/usecases/import-log-file/errors/checksum-conflict.error'
import { LogFile } from '@/domain/enterprise/entities/log-file/log-file.entity'

export class InMemoryLogFilesRepository implements LogFilesRepository {
  private items: LogFile[] = []

  async create (data: LogFileCreateInput): Promise<LogFile> {
    const logFile = LogFile.create({ filename: data.filename })
    if (data.status && data.status !== 'PENDING') {
      if (data.status === 'FAILED') logFile.fail(new Date())
      else if (data.status === 'PROCESSING') logFile.startProcessing()
      else if (data.status === 'COMPLETED') {
        logFile.startProcessing()
        logFile.complete(0, 0, 0, new Date())
      }
    }
    this.items.push(logFile)
    return logFile
  }

  async findById (id: string): Promise<LogFile | null> {
    return this.items.find((item) => item.id === id) ?? null
  }

  async findDuplicateByChecksum (checksum: string): Promise<LogFile | null> {
    return this.items.find(
      (item) => item.checksum === checksum && item.status !== 'FAILED'
    ) ?? null
  }

  async findMany (params: PaginationParams): Promise<PaginatedItems<LogFile>> {
    const page = params.page ?? 1
    const pageSize = params.pageSize ?? 10
    const order = params.order ?? 'desc'
    const sorted = [...this.items].sort((a, b) =>
      order === 'asc'
        ? a.createdAt.getTime() - b.createdAt.getTime()
        : b.createdAt.getTime() - a.createdAt.getTime()
    )
    const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize)
    return {
      page,
      pageSize,
      totalItems: this.items.length,
      totalPages: Math.ceil(this.items.length / pageSize),
      items: pageItems,
      order,
    }
  }

  async save (logFile: LogFile): Promise<LogFile> {
    this.assertActiveChecksumUnique(logFile)
    const index = this.items.findIndex((item) => item.id === logFile.id)
    if (index < 0) {
      this.items.push(logFile)
    } else {
      this.items[index] = logFile
    }
    return logFile
  }

  async claimForProcessing (id: string): Promise<LogFile | null> {
    const existing = await this.findById(id)
    if (!existing) return null
    if (existing.status !== 'PENDING' && existing.status !== 'FAILED') {
      return null
    }
    existing.startProcessing()
    return this.save(existing)
  }

  async update (id: string, data: LogFileProgressUpdate): Promise<LogFile> {
    const existing = await this.findById(id)
    if (!existing) {
      throw new Error(`LogFile ${id} not found`)
    }
    const restored = LogFile.restore({
      ...existing.toJSON(),
      ...data,
      checksum: data.checksum ?? existing.checksum,
      sizeBytes: data.sizeBytes ?? existing.sizeBytes,
      totalLines: data.totalLines ?? existing.totalLines,
      processedLines: data.processedLines ?? existing.processedLines,
      failedLines: data.failedLines ?? existing.failedLines,
      status: data.status ?? existing.status,
      processedAt: data.processedAt !== undefined ? data.processedAt : existing.processedAt,
      updatedAt: new Date(),
    })
    return this.save(restored)
  }

  async delete (id: string): Promise<void> {
    this.items = this.items.filter((item) => item.id !== id)
  }

  async count (): Promise<number> {
    return this.items.length
  }

  private assertActiveChecksumUnique (logFile: LogFile): void {
    if (!logFile.checksum || logFile.status === 'FAILED') return
    const duplicate = this.items.find(
      (item) =>
        item.id !== logFile.id &&
        item.checksum === logFile.checksum &&
        item.status !== 'FAILED'
    )
    if (duplicate) {
      throw new ChecksumConflictError(duplicate.id)
    }
  }
}
