import type { UseCase } from '@/core/domain/application/use-case'
import {
  type AppLogger,
  noopAppLogger,
} from '@/domain/application/ports/app-logger.port'
import type { LogFileParser } from '@/domain/application/ports/log-file-processor.port'
import type { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import type { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import {
  type IngestBatchesResult,
  LogEntryBatchIngestor,
} from '@/domain/application/services/log-entry-batch-ingestor/log-entry-batch-ingestor.service'
import { LogFile } from '@/domain/enterprise/entities/log-file/log-file.entity'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'

export type ProcessLogFileRequest = {
  logFileId: string
  filePath: string
  retainFileOnFailure?: boolean
}

export class ProcessLogFileUseCase implements UseCase {
  private readonly fileProcessor: LogFileParser
  private readonly logger: AppLogger
  private readonly ingestor: LogEntryBatchIngestor

  constructor (
    private readonly logFilesRepository: LogFilesRepository,
    private readonly logEntriesRepository: LogEntriesRepository,
    fileProcessor: LogFileParser,
    logger: AppLogger = noopAppLogger,
    ingestor: LogEntryBatchIngestor = new LogEntryBatchIngestor(
      fileProcessor,
      logEntriesRepository
    )
  ) {
    this.fileProcessor = fileProcessor
    this.logger = logger
    this.ingestor = ingestor
  }

  async execute (req: ProcessLogFileRequest): Promise<LogFile> {
    let logFile = await this.logFilesRepository.claimForProcessing(req.logFileId)
    if (!logFile) {
      const existing = await this.logFilesRepository.findById(req.logFileId)
      if (!existing) {
        await this.fileProcessor.removeFile(req.filePath)
        throw new ResourceNotFoundError('LogFile')
      }
      if (existing.status === 'COMPLETED') {
        await this.fileProcessor.removeFile(req.filePath)
      }
      return existing
    }
    await this.logEntriesRepository.deleteManyByLogFileId(req.logFileId)
    const startedAt = Date.now()
    let succeeded = false
    let result: IngestBatchesResult = {
      totalLines: 0,
      processedLines: 0,
      failedLines: 0,
      wroteAnyEntries: false,
    }
    try {
      result = await this.ingestor.ingest({
        logFileId: req.logFileId,
        filePath: req.filePath,
        importedAt: new Date(),
        onProgress: async (totalLines, processedLines, failedLines) => {
          const current = logFile!
          logFile = LogFile.create(
            {
              ...current.toJSON(),
              totalLines,
              processedLines,
              failedLines,
            },
            current.id
          )
          await this.logFilesRepository.save(logFile)
        },
      })
      const prev = logFile
      logFile = LogFile.create(
        {
          ...prev.toJSON(),
          status: 'COMPLETED',
          totalLines: result.totalLines,
          processedLines: result.processedLines,
          failedLines: result.failedLines,
          processedAt: new Date(),
        },
        prev.id
      )
      const completed = await this.logFilesRepository.save(logFile)
      this.logger.log(
        `Processed log file ${req.logFileId}: lines=${result.processedLines} failed=${result.failedLines} durationMs=${Date.now() - startedAt}`
      )
      succeeded = true
      return completed
    } catch (error) {
      const before = logFile
      logFile = LogFile.create(
        {
          ...before.toJSON(),
          status: 'FAILED',
          processedAt: new Date(),
          totalLines: result.totalLines ?? before.totalLines,
          processedLines: result.processedLines ?? before.processedLines,
          failedLines: result.failedLines ?? before.failedLines,
        },
        before.id
      )
      await this.logFilesRepository.save(logFile)
      this.logger.error(
        `Failed processing log file ${req.logFileId}: lines=${result.processedLines} failed=${result.failedLines} durationMs=${Date.now() - startedAt}`
      )
      throw error
    } finally {
      const cleanup: Array<Promise<unknown>> = []
      if (result.wroteAnyEntries) {
        cleanup.push(this.logEntriesRepository.invalidateDashboardCache())
      }
      const shouldRetain = !succeeded && req.retainFileOnFailure === true
      if (!shouldRetain) {
        cleanup.push(this.fileProcessor.removeFile(req.filePath))
      }
      if (cleanup.length > 0) {
        await Promise.all(cleanup)
      }
    }
  }
}
