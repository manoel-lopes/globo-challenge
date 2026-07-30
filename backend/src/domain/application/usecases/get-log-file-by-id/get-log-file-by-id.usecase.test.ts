import type { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import { InMemoryLogFilesRepository } from '@/infra/persistence/repositories/in-memory/in-memory-log-files.repository'
import { GetLogFileByIdUseCase } from './get-log-file-by-id.usecase'

describe('GetLogFileByIdUseCase', () => {
  let sut: GetLogFileByIdUseCase
  let logFilesRepository: LogFilesRepository

  beforeEach(() => {
    logFilesRepository = new InMemoryLogFilesRepository()
    sut = new GetLogFileByIdUseCase(logFilesRepository)
  })

  it('should throw when log file does not exist', async () => {
    await expect(sut.execute({ id: 'missing' })).rejects.toThrow('LogFile not found')
  })

  it('should return the log file when it exists', async () => {
    const created = await logFilesRepository.create({ filename: 'app.log' })

    const result = await sut.execute({ id: created.id })

    expect(result.id).toBe(created.id)
    expect(result.filename).toBe('app.log')
  })
})
