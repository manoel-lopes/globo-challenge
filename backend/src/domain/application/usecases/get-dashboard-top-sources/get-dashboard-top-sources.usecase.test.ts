import { InMemoryLogEntriesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-entries.repository'
import { GetDashboardTopSourcesUseCase } from './get-dashboard-top-sources.usecase'

describe('GetDashboardTopSourcesUseCase', () => {
  let sut: GetDashboardTopSourcesUseCase
  let logEntriesRepository: InMemoryLogEntriesRepository

  beforeEach(async () => {
    logEntriesRepository = new InMemoryLogEntriesRepository()
    sut = new GetDashboardTopSourcesUseCase(logEntriesRepository)
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
      {
        logFileId: 'file-1',
        level: 'INFO',
        timestamp: new Date('2024-01-01T12:00:00.000Z'),
        source: 'worker',
        message: 'tick',
        rawLine: 'tick',
        metadata: null,
      },
    ])
  })

  it('should rank sources by volume', async () => {
    const result = await sut.execute({ by: 'volume', limit: 10 })

    expect(result).toHaveLength(2)
    expect(result[0].source).toBe('api')
    expect(result[0].total).toBe(2)
    expect(result[1].source).toBe('worker')
  })

  it('should rank sources by error rate', async () => {
    const result = await sut.execute({ by: 'errorRate', limit: 10 })

    expect(result[0].source).toBe('api')
    expect(result[0].errorRate).toBe(0.5)
  })
})
