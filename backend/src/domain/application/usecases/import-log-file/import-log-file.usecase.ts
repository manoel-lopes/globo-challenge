import type { Readable } from 'node:stream'
import type { UseCase } from '@/core/domain/application/use-case'
import type { LogFileProcessorPort } from '@/domain/application/ports/log-file-processor.port'
import type { LogProcessingQueue } from '@/domain/application/queues/log-processing.queue'
import type { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import type { LogFile } from '@/domain/enterprise/entities/log-file/log-file.entity'
import { FileSizeLimit } from '@/domain/enterprise/value-objects/file-size-limit/file-size-limit.vo'
import { LogFileName } from '@/domain/enterprise/value-objects/log-file/log-file-name.vo'
import { ProcessLogFileUseCase } from '../process-log-file/process-log-file.usecase'
import { ChecksumConflictError } from './errors/checksum-conflict.error'
import { DuplicateLogFileError } from './errors/duplicate-log-file.error'
import { FileTooLargeError } from './errors/file-too-large.error'
import { LogProcessingUnavailableError } from './errors/log-processing-unavailable.error'
import { MissingLogFileError } from './errors/missing-log-file.error'
import { UnsupportedFileTypeError } from './errors/unsupported-file-type.error'

export type ImportLogFileRequest = {
  filename: string
  mimetype?: string
  fileSize?: number
  maxSize: number
  syncMaxBytes: number
  tempDir?: string
  stream: Readable
  isTruncated?: () => boolean
}

export class ImportLogFileUseCase implements UseCase {
  constructor (
    private readonly logFilesRepository: LogFilesRepository,
    private readonly fileProcessor: LogFileProcessorPort,
    private readonly processLogFileUseCase: ProcessLogFileUseCase,
    private readonly logProcessingQueue: LogProcessingQueue
  ) {}

  async execute (req: ImportLogFileRequest): Promise<LogFile> {
    if (!req.filename) {
      throw new MissingLogFileError()
    }
    if (!LogFileName.isSupported(req.filename)) {
      throw new UnsupportedFileTypeError(req.filename)
    }
    const maxSize = FileSizeLimit.create(req.maxSize)
    const syncMaxBytes = FileSizeLimit.create(
      req.syncMaxBytes > 0 ? req.syncMaxBytes : req.maxSize
    )
    if (typeof req.fileSize === 'number' && maxSize.isExceededBy(req.fileSize)) {
      throw new FileTooLargeError(req.maxSize)
    }
    const logFile = await this.logFilesRepository.create({
      filename: req.filename,
      status: 'PENDING',
    })
    const filePath = this.fileProcessor.resolveUploadPath(req.tempDir, logFile.id)
    try {
      await this.fileProcessor.ensureDir(req.tempDir || this.fileProcessor.defaultTempDir())
      const checksum = await this.fileProcessor.spoolToDisk(req.stream, filePath)
      const sizeBytes = await this.fileProcessor.getFileSize(filePath)
      if (maxSize.isExceededBy(sizeBytes) || req.isTruncated?.()) {
        await this.failAndCleanup(logFile, filePath)
        throw new FileTooLargeError(req.maxSize)
      }
      const duplicate = await this.logFilesRepository.findDuplicateByChecksum(checksum)
      if (duplicate) {
        await this.discardUpload(logFile.id, filePath)
        throw new DuplicateLogFileError(duplicate.id)
      }
      logFile.stage(checksum, sizeBytes)
      let spooled: LogFile
      try {
        spooled = await this.logFilesRepository.save(logFile)
      } catch (error) {
        if (error instanceof ChecksumConflictError) {
          const existingId =
            error.existingLogFileId ??
            (await this.logFilesRepository.findDuplicateByChecksum(checksum))?.id
          await this.discardUpload(logFile.id, filePath)
          if (!existingId) throw error
          throw new DuplicateLogFileError(existingId)
        }
        throw error
      }
      if (!syncMaxBytes.isExceededBy(sizeBytes)) {
        return this.processLogFileUseCase.execute({
          logFileId: logFile.id,
          filePath,
        })
      }

      try {
        await this.logProcessingQueue.enqueue({
          logFileId: logFile.id,
          filePath,
        })
      } catch (error) {
        await this.failAndCleanup(logFile, filePath)
        if (error instanceof LogProcessingUnavailableError) {
          throw error
        }
        throw new LogProcessingUnavailableError(error)
      }
      return spooled
    } catch (error) {
      if (
        error instanceof FileTooLargeError ||
        error instanceof DuplicateLogFileError ||
        error instanceof LogProcessingUnavailableError
      ) {
        throw error
      }
      const current = await this.logFilesRepository.findById(logFile.id)
      if (current?.isActiveUpload()) {
        await this.failAndCleanup(current, filePath)
      }
      throw error
    }
  }

  private async failAndCleanup (logFile: LogFile, filePath: string): Promise<void> {
    logFile.fail(new Date())
    await Promise.all([
      this.fileProcessor.removeFile(filePath),
      this.logFilesRepository.save(logFile),
    ])
  }

  private async discardUpload (logFileId: string, filePath: string): Promise<void> {
    await Promise.all([
      this.fileProcessor.removeFile(filePath),
      this.logFilesRepository.delete(logFileId),
    ])
  }
}
