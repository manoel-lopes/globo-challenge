import { InMemoryLogEntriesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-entries.repository'
import { GetDashboardSummaryUseCase } from './get-dashboard-summary.usecase'

describe('GetDashboardSummaryUseCase', () => {
  let sut: GetDashboardSummaryUseCase
  let logEntriesRepository: InMemoryLogEntriesRepository

  beforeEach(async () => {
    logEntriesRepository = new InMemoryLogEntriesRepository()
    logEntriesRepository.filesProcessed = 1
    sut = new GetDashboardSummaryUseCase(logEntriesRepository)
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
        source: 'worker',
        message: 'ok',
        rawLine: 'ok',
        metadata: null,
      },
    ])
  })

  it('should return aggregate indicators', async () => {
    const result = await sut.execute()

    expect(result.totalEntries).toBe(2)
    expect(result.countsByLevel.ERROR).toBe(1)
    expect(result.countsByLevel.INFO).toBe(1)
    expect(result.distinctSources).toBe(2)
    expect(result.filesProcessed).toBe(1)
  })
})
