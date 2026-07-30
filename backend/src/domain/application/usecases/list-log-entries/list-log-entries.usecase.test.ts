import { InMemoryLogEntriesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-entries.repository'
import { ListLogEntriesUseCase } from './list-log-entries.usecase'

describe('ListLogEntriesUseCase', () => {
  let sut: ListLogEntriesUseCase
  let logEntriesRepository: InMemoryLogEntriesRepository

  beforeEach(async () => {
    logEntriesRepository = new InMemoryLogEntriesRepository()
    sut = new ListLogEntriesUseCase(logEntriesRepository)
    await logEntriesRepository.createMany([
      {
        logFileId: 'file-1',
        level: 'ERROR',
        timestamp: new Date('2024-01-01T10:00:00.000Z'),
        source: 'api',
        message: 'boom',
        rawLine: 'boom',
        metadata: null,
      },
      {
        logFileId: 'file-1',
        level: 'INFO',
        timestamp: new Date('2024-01-01T11:00:00.000Z'),
        source: 'api',
        message: 'ok',
        rawLine: 'ok',
        metadata: null,
      },
    ])
  })

  it('should filter by level using cursor pagination by default', async () => {
    const result = await sut.execute({ level: 'ERROR' })

    expect('items' in result).toBe(true)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.level).toBe('ERROR')
    expect('nextCursor' in result).toBe(true)
  })

  it('should use offset pagination when page is provided', async () => {
    const result = await sut.execute({ page: 1, pageSize: 1 })

    expect('totalItems' in result).toBe(true)
    if ('totalItems' in result) {
      expect(result.totalItems).toBe(2)
      expect(result.items).toHaveLength(1)
    }
  })
})
