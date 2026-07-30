import { InMemoryLogEntriesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-entries.repository'
import { GetDashboardTrendsUseCase } from './get-dashboard-trends.usecase'

describe('GetDashboardTrendsUseCase', () => {
  let sut: GetDashboardTrendsUseCase
  let logEntriesRepository: InMemoryLogEntriesRepository

  beforeEach(async () => {
    logEntriesRepository = new InMemoryLogEntriesRepository()
    sut = new GetDashboardTrendsUseCase(logEntriesRepository)
    await logEntriesRepository.createMany([
      {
        logFileId: 'file-1',
        level: 'ERROR',
        timestamp: new Date('2024-01-01T10:15:00.000Z'),
        source: 'api',
        message: 'boom',
        rawLine: 'boom',
        metadata: null,
      },
      {
        logFileId: 'file-1',
        level: 'INFO',
        timestamp: new Date('2024-01-01T10:45:00.000Z'),
        source: 'api',
        message: 'ok',
        rawLine: 'ok',
        metadata: null,
      },
      {
        logFileId: 'file-1',
        level: 'WARN',
        timestamp: new Date('2024-01-01T11:00:00.000Z'),
        source: 'worker',
        message: 'slow',
        rawLine: 'slow',
        metadata: null,
      },
    ])
  })

  it('should return hourly buckets', async () => {
    const result = await sut.execute({ bucket: 'hour' })

    expect(result.bucket).toBe('hour')
    expect(result.series).toHaveLength(2)
    expect(result.series[0].total).toBe(2)
    expect(result.series[1].total).toBe(1)
  })

  it('should split counts by level when requested', async () => {
    const result = await sut.execute({ bucket: 'hour', splitByLevel: true })

    expect(result.series[0].countsByLevel?.ERROR).toBe(1)
    expect(result.series[0].countsByLevel?.INFO).toBe(1)
  })
})
