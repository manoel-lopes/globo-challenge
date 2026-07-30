import { InMemoryLogEntriesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-entries.repository'
import { GetLogEntryByIdUseCase } from './get-log-entry-by-id.usecase'

describe('GetLogEntryByIdUseCase', () => {
  let sut: GetLogEntryByIdUseCase
  let logEntriesRepository: InMemoryLogEntriesRepository

  beforeEach(() => {
    logEntriesRepository = new InMemoryLogEntriesRepository()
    sut = new GetLogEntryByIdUseCase(logEntriesRepository)
  })

  it('should return a log entry by id', async () => {
    await logEntriesRepository.createMany([
      {
        logFileId: 'file-1',
        level: 'INFO',
        timestamp: new Date('2024-01-01T10:00:00.000Z'),
        source: 'api',
        message: 'hello',
        rawLine: 'hello',
        metadata: null,
      },
    ])
    const [entry] = (await logEntriesRepository.findMany({}, { page: 1, pageSize: 1 })).items

    const result = await sut.execute({ id: entry.id })

    expect(result.id).toBe(entry.id)
    expect(result.message).toBe('hello')
  })

  it('should throw when log entry does not exist', async () => {
    await expect(
      sut.execute({ id: '00000000-0000-0000-0000-000000000000' })
    ).rejects.toThrow('LogEntry not found')
  })
})
