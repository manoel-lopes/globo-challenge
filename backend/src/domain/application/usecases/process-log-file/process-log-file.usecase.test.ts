import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { LogEntriesRepository } from '@/domain/application/repositories/log-entries.repository'
import type { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { LogFileParser } from '@/infra/log-processing/log-file.parser'
import { InMemoryLogEntriesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-entries.repository'
import { InMemoryLogFilesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-files.repository'
import { ProcessLogFileUseCase } from './process-log-file.usecase'

describe('ProcessLogFileUseCase', () => {
  let sut: ProcessLogFileUseCase
  let logFilesRepository: LogFilesRepository
  let logEntriesRepository: LogEntriesRepository
  let tempDir: string

  beforeEach(async () => {
    logFilesRepository = new InMemoryLogFilesRepository()
    logEntriesRepository = new InMemoryLogEntriesRepository()
    sut = new ProcessLogFileUseCase(
      logFilesRepository,
      logEntriesRepository,
      new LogFileParser()
    )
    tempDir = await mkdtemp(join(tmpdir(), 'process-log-'))
  })

  it('should process a spooled file and mark it COMPLETED', async () => {
    const logFile = await logFilesRepository.create({
      filename: 'app.log',
      status: 'PENDING',
    })
    const filePath = join(tempDir, `${logFile.id}.upload`)
    const content = [
      JSON.stringify({ level: 'INFO', message: 'started', timestamp: '2024-01-01T00:00:00Z', service: 'api' }),
      '[2024-01-01T00:00:01Z] ERROR api boom',
      'unclassified line',
    ].join('\n')
    await writeFile(filePath, content)

    const result = await sut.execute({ logFileId: logFile.id, filePath })

    expect(result.status).toBe('COMPLETED')
    expect(result.totalLines).toBe(3)
    expect(result.processedLines).toBe(3)
    expect(result.failedLines).toBe(1)
    expect(result.processedAt).toBeInstanceOf(Date)

    const entries = await logEntriesRepository.findMany({}, { page: 1, pageSize: 10 })
    expect(entries.totalItems).toBe(3)
  })

  it('should throw when log file does not exist', async () => {
    const filePath = join(tempDir, 'missing.upload')
    await writeFile(filePath, 'line\n')

    await expect(
      sut.execute({ logFileId: '00000000-0000-0000-0000-000000000000', filePath })
    ).rejects.toThrow('LogFile not found')
  })
})
