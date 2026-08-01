import type { Readable } from 'node:stream'
import type { ClassifiedLogLine } from '@/domain/enterprise/services/log-classification/classified-log-line'

export type ParsedLogBatch = {
  batch: ClassifiedLogLine[]
  totalLines: number
  failedLines: number
  done: boolean
}

export type LogFileProcessorPort = {
  iterateBatches(
    stream: Readable,
    batchSize: number,
    importedAt?: Date
  ): AsyncGenerator<ParsedLogBatch>
  openReadStream(filePath: string): Readable
  removeFile(filePath: string): Promise<void>
  ensureDir(dir: string): Promise<void>
  resolveUploadPath(tempDir: string | undefined, logFileId: string): string
  spoolToDisk(stream: Readable, filePath: string): Promise<string>
  getFileSize(filePath: string): Promise<number>
  defaultTempDir(): string
}

export const LogFileProcessorPort = Symbol('LogFileProcessorPort')
