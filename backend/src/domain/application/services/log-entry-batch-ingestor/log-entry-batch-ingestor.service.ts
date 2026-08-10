import type { LogFileParser } from '@/domain/application/ports/log-file-processor.port'
import type { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'

export type IngestBatchesRequest = {
  logFileId: string
  filePath: string
  importedAt: Date
  onProgress: (
    totalLines: number,
    processedLines: number,
    failedLines: number
  ) => Promise<void>
}

export type IngestBatchesResult = {
  totalLines: number
  processedLines: number
  failedLines: number
  wroteAnyEntries: boolean
}

export class LogEntryBatchIngestor {
  private readonly BATCH_SIZE = 1000
  private readonly PROGRESS_UPDATE_INTERVAL_MS = 500

  constructor (
    private readonly fileProcessor: LogFileParser,
    private readonly logEntriesRepository: LogEntriesRepository
  ) {}

  async ingest (req: IngestBatchesRequest): Promise<IngestBatchesResult> {
    let totalLines = 0
    let failedLines = 0
    let processedLines = 0
    let wroteAnyEntries = false
    let lastProgressUpdateAt = 0
    const stream = this.fileProcessor.openReadStream(req.filePath)
    for await (const chunk of this.fileProcessor.iterateBatches(
      stream,
      this.BATCH_SIZE,
      req.importedAt
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
        wroteAnyEntries = true
      }
      const now = Date.now()
      if (now - lastProgressUpdateAt >= this.PROGRESS_UPDATE_INTERVAL_MS) {
        await req.onProgress(totalLines, processedLines, failedLines)
        lastProgressUpdateAt = now
      }
    }
    return { totalLines, processedLines, failedLines, wroteAnyEntries }
  }
}
