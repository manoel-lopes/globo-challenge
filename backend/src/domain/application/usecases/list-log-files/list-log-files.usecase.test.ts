import type { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { InMemoryLogFilesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-files.repository'
import { ListLogFilesUseCase } from './list-log-files.usecase'

describe('ListLogFilesUseCase', () => {
  let sut: ListLogFilesUseCase
  let logFilesRepository: LogFilesRepository

  beforeEach(() => {
    logFilesRepository = new InMemoryLogFilesRepository()
    sut = new ListLogFilesUseCase(logFilesRepository)
  })

  it('should list log files with pagination', async () => {
    await logFilesRepository.create({ filename: 'a.log' })
    await logFilesRepository.create({ filename: 'b.log' })

    const result = await sut.execute({ page: 1, pageSize: 10 })

    expect(result.totalItems).toBe(2)
    expect(result.items).toHaveLength(2)
  })
})
