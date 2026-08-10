import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { setTimeout as delay } from 'node:timers/promises'
import type { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import type { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { LogFileParser } from '@/infra/log-processing/log-file/log-file.parser'
import { InProcessLogProcessingQueue } from '@/infra/log-processing/queue/in-process-log-processing.queue'
import { InMemoryLogEntriesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-entries.repository'
import { InMemoryLogFilesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-files.repository'
import { ProcessLogFileUseCase } from '../process-log-file/process-log-file.usecase'
import { ImportLogFileUseCase } from './import-log-file.usecase'

describe('ImportLogFileUseCase', () => {
  let sut: ImportLogFileUseCase
  let logFilesRepository: LogFilesRepository
  let logEntriesRepository: LogEntriesRepository
  let tempDir: string

  beforeEach(async () => {
    logFilesRepository = new InMemoryLogFilesRepository()
    logEntriesRepository = new InMemoryLogEntriesRepository()
    const fileProcessor = new LogFileParser()
    const processLogFileUseCase = new ProcessLogFileUseCase(
      logFilesRepository,
      logEntriesRepository,
      fileProcessor
    )
    const logProcessingQueue = new InProcessLogProcessingQueue(processLogFileUseCase)
    sut = new ImportLogFileUseCase(
      logFilesRepository,
      fileProcessor,
      processLogFileUseCase,
      logProcessingQueue
    )
    tempDir = await mkdtemp(join(tmpdir(), 'import-log-'))
  })

  it('should reject unsupported file types', async () => {
    await expect(
      sut.execute({
        filename: 'notes.csv',
        maxSize: 1024,
        syncMaxBytes: 1024,
        tempDir,
        stream: Readable.from(['line']),
      })
    ).rejects.toThrow('Unsupported file type: notes.csv')
  })

  it('should reject files larger than the configured max size', async () => {
    await expect(
      sut.execute({
        filename: 'app.log',
        fileSize: 2048,
        maxSize: 1024,
        syncMaxBytes: 1024,
        tempDir,
        stream: Readable.from(['line']),
      })
    ).rejects.toThrow('File exceeds maximum allowed size of 1024 bytes')
  })

  it('should import and classify log lines synchronously', async () => {
    const content = [
      JSON.stringify({ level: 'INFO', message: 'started', timestamp: '2024-01-01T00:00:00Z', service: 'api' }),
      '[2024-01-01T00:00:01Z] ERROR api boom',
      'unclassified line',
    ].join('\n')

    const result = await sut.execute({
      filename: 'app.log',
      maxSize: 10_000,
      syncMaxBytes: 10_000,
      tempDir,
      stream: Readable.from([content]),
    })

    expect(result.status).toBe('COMPLETED')
    expect(result.totalLines).toBe(3)
    expect(result.processedLines).toBe(3)
    expect(result.failedLines).toBe(1)
    expect(result.processedAt).toBeInstanceOf(Date)

    const entries = await logEntriesRepository.findMany({}, { page: 1, pageSize: 10 })
    expect(entries.totalItems).toBe(3)
  })

  it('should return PENDING for large files and complete asynchronously', async () => {
    const content = 'INFO line one\nERROR line two\n'
    const result = await sut.execute({
      filename: 'large.log',
      maxSize: 10_000,
      syncMaxBytes: 1,
      tempDir,
      stream: Readable.from([content]),
    })

    expect(result.status).toBe('PENDING')

    await delay(50)
    const settled = await logFilesRepository.findById(result.id)
    expect(settled?.status).toBe('COMPLETED')
    expect(settled?.totalLines).toBe(2)

    const entries = await logEntriesRepository.findMany({}, { page: 1, pageSize: 10 })
    expect(entries.totalItems).toBe(2)
  })

  it('should reject truncated uploads after spooling', async () => {
    await expect(
      sut.execute({
        filename: 'huge.log',
        maxSize: 10_000,
        syncMaxBytes: 10_000,
        tempDir,
        stream: Readable.from(['INFO ok\n']),
        isTruncated: () => true,
      })
    ).rejects.toThrow('File exceeds maximum allowed size of 10000 bytes')
  })

  it('should reject concurrent uploads of the same checksum', async () => {
    const content = 'INFO concurrent duplicate line\n'
    const request = () =>
      sut.execute({
        filename: 'dup.log',
        maxSize: 10_000,
        syncMaxBytes: 10_000,
        tempDir,
        stream: Readable.from([content]),
      })

    const first = await request()
    expect(first.status).toBe('COMPLETED')

    await expect(request()).rejects.toThrow(/Log file already imported as/)
    expect(await logFilesRepository.count()).toBe(1)
  })

  it('should reject racing duplicate checksum saves via ChecksumConflictError', async () => {
    const content = 'WARN race line\n'
    const [a, b] = await Promise.allSettled([
      sut.execute({
        filename: 'race-a.log',
        maxSize: 10_000,
        syncMaxBytes: 10_000,
        tempDir,
        stream: Readable.from([content]),
      }),
      sut.execute({
        filename: 'race-b.log',
        maxSize: 10_000,
        syncMaxBytes: 10_000,
        tempDir,
        stream: Readable.from([content]),
      }),
    ])

    const fulfilled = [a, b].filter((r) => r.status === 'fulfilled')
    const rejected = [a, b].filter((r) => r.status === 'rejected')
    expect(fulfilled).toHaveLength(1)
    expect(rejected).toHaveLength(1)
    expect((rejected[0]).reason.message).toMatch(
      /Log file already imported as/
    )
    expect(await logFilesRepository.count()).toBe(1)
  })
})
