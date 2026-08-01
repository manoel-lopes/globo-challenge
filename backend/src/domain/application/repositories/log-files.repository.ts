import type { PaginatedItems } from '@/core/domain/application/paginated-items'
import type { PaginationParams } from '@/core/domain/application/pagination-params'
import type { LogFile, LogFileProps, LogFileStatus } from '@/domain/enterprise/entities/log-file/log-file.entity'

export type LogFileCreateInput = Pick<LogFileProps, 'filename'> & {
  status?: LogFileStatus
}

export type LogFileProgressUpdate = {
  checksum?: string
  sizeBytes?: number
  totalLines?: number
  processedLines?: number
  failedLines?: number
  status?: LogFileStatus
  processedAt?: Date | null
}

export type LogFilesRepository = {
  create(data: LogFileCreateInput): Promise<LogFile>
  findById(id: string): Promise<LogFile | null>
  findDuplicateByChecksum(checksum: string): Promise<LogFile | null>
  findMany(params: PaginationParams): Promise<PaginatedItems<LogFile>>
  update(id: string, data: LogFileProgressUpdate): Promise<LogFile>
  delete(id: string): Promise<void>
  count(): Promise<number>
}

export const LogFilesRepository = Symbol('LogFilesRepository')
