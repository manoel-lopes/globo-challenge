import { faker } from '@faker-js/faker'
import type { LogFile, LogFileStatus } from '@/core/domain/entities/log-file'

export function createLogFile(overrides: Partial<LogFile> = {}): LogFile {
  const status: LogFileStatus = overrides.status ?? 'COMPLETED'
  const totalLines = overrides.totalLines ?? faker.number.int({ min: 20, max: 500 })
  const now = new Date().toISOString()
  return {
    id: faker.string.uuid(),
    filename: `${faker.hacker.noun()}-service.log`,
    status,
    checksum: status === 'FAILED' ? null : faker.string.alphanumeric(32),
    sizeBytes: faker.number.int({ min: 1024, max: 500_000 }),
    totalLines,
    processedLines: status === 'COMPLETED' ? totalLines : 0,
    failedLines: status === 'FAILED' ? totalLines : 0,
    processedAt: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}
