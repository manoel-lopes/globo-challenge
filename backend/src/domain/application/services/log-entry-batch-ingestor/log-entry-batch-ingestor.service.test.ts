import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import { LogFileParser } from '@/infra/log-processing/log-file/log-file.parser'
import { InMemoryLogEntriesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-entries.repository'
import { LogEntryBatchIngestor } from './log-entry-batch-ingestor.service'

describe('LogEntryBatchIngestor', () => {
  let sut: LogEntryBatchIngestor
  let logEntriesRepository: LogEntriesRepository
  let tempDir: string

  beforeEach(async () => {
    logEntriesRepository = new InMemoryLogEntriesRepository()
    sut = new LogEntryBatchIngestor(new LogFileParser(), logEntriesRepository)
    tempDir = await mkdtemp(join(tmpdir(), 'log-entry-batch-ingestor-'))
  })

  it('should ingest all lines, persist them, and report progress', async () => {
    const filePath = join(tempDir, 'app.log')
    const content = [
      JSON.stringify({ level: 'INFO', message: 'started', timestamp: '2024-01-01T00:00:00Z', service: 'api' }),
      '[2024-01-01T00:00:01Z] ERROR api boom',
      'unclassified line',
    ].join('\n')
    await writeFile(filePath, content)
    const progressUpdates: Array<[number, number, number]> = []

    const result = await sut.ingest({
      logFileId: 'log-file-1',
      filePath,
      importedAt: new Date('2024-01-01T00:00:00Z'),
      onProgress: async (totalLines, processedLines, failedLines) => {
        progressUpdates.push([totalLines, processedLines, failedLines])
      },
    })

    expect(result.totalLines).toBe(3)
    expect(result.processedLines).toBe(3)
    expect(result.failedLines).toBe(1)
    expect(result.wroteAnyEntries).toBe(true)
    expect(progressUpdates).toEqual([[3, 3, 1]])

    const entries = await logEntriesRepository.findMany({}, { page: 1, pageSize: 10 })
    expect(entries.totalItems).toBe(3)
  })

  it('should report no entries written for an empty file', async () => {
    const filePath = join(tempDir, 'empty.log')
    await writeFile(filePath, '')

    const result = await sut.ingest({
      logFileId: 'log-file-2',
      filePath,
      importedAt: new Date('2024-01-01T00:00:00Z'),
      onProgress: async () => {},
    })

    expect(result.totalLines).toBe(0)
    expect(result.processedLines).toBe(0)
    expect(result.failedLines).toBe(0)
    expect(result.wroteAnyEntries).toBe(false)
  })
})
