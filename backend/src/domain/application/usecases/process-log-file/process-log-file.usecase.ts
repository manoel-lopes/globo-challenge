import { createReadStream } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { UseCase } from '@/core/domain/application/use-case'
import { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { LogFileParser } from '@/infra/log-processing/log-file.parser'
import type { LogFile } from '@/domain/enterprise/entities/log-file.entity'
import { ResourceNotFoundError } from '@/shared/application/errors/resource-not-found.error'

const BATCH_SIZE = 1000

export type ProcessLogFileRequest = {
  logFileId: string
  filePath: string
}

@Injectable()
export class ProcessLogFileUseCase implements UseCase {
  private readonly logger = new Logger(ProcessLogFileUseCase.name)

  constructor (
    @Inject(LogFilesRepository) private readonly logFilesRepository: LogFilesRepository,
    @Inject(LogEntriesRepository) private readonly logEntriesRepository: LogEntriesRepository,
    private readonly logFileParser: LogFileParser
  ) {}

  async execute (req: ProcessLogFileRequest): Promise<LogFile> {
    const existing = await this.logFilesRepository.findById(req.logFileId)
    if (!existing) {
      await this.cleanupTempFile(req.filePath)
      throw new ResourceNotFoundError('LogFile')
    }
    await this.logFilesRepository.update(req.logFileId, { status: 'PROCESSING' })
    const importedAt = new Date()
    const startedAt = Date.now()
    let totalLines = 0
    let failedLines = 0
    let processedLines = 0
    try {
      const stream = createReadStream(req.filePath)
      for await (const chunk of this.logFileParser.iterateBatches(
        stream,
        BATCH_SIZE,
        importedAt
      )) {
        totalLines = chunk.totalLines
        failedLines = chunk.failedLines
        if (chunk.batch.length > 0) {
          await this.logEntriesRepository.createMany(
            chunk.batch.map((entry) => ({
              logFileId: req.logFileId,
              level: entry.level,
              timestamp: entry.timestamp,
              source: entry.source,
              message: entry.message,
              rawLine: entry.rawLine,
              metadata: entry.metadata,
            }))
          )
          processedLines += chunk.batch.length
        }
        await this.logFilesRepository.update(req.logFileId, {
          totalLines,
          processedLines,
          failedLines,
        })
      }
      const completed = await this.logFilesRepository.update(req.logFileId, {
        status: 'COMPLETED',
        totalLines,
        processedLines,
        failedLines,
        processedAt: new Date(),
      })
      this.logger.log(
        `Processed log file ${req.logFileId}: lines=${processedLines} failed=${failedLines} durationMs=${Date.now() - startedAt}`
      )
      return completed
    } catch (error) {
      await this.logFilesRepository.update(req.logFileId, {
        status: 'FAILED',
        totalLines,
        processedLines,
        failedLines,
        processedAt: new Date(),
      })
      this.logger.error(
        `Failed processing log file ${req.logFileId}: lines=${processedLines} failed=${failedLines} durationMs=${Date.now() - startedAt}`
      )
      throw error
    } finally {
      await this.cleanupTempFile(req.filePath)
    }
  }

  private async cleanupTempFile (filePath: string): Promise<void> {
    try {
      await unlink(filePath)
    } catch {}
  }
}
