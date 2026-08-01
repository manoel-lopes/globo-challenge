import { faker } from '@faker-js/faker'
import type { LogEntry, LogLevel } from '@/core/domain/entities/log-entry'

export function createLogEntry(overrides: Partial<LogEntry> = {}): LogEntry {
  const timestamp = overrides.timestamp ?? new Date().toISOString()
  const level: LogLevel = overrides.level ?? 'INFO'
  const source = overrides.source ?? faker.hacker.noun()
  const message = overrides.message ?? faker.hacker.phrase()
  return {
    id: faker.string.uuid(),
    logFileId: faker.string.uuid(),
    level,
    timestamp,
    source,
    message,
    rawLine: `[${timestamp}] ${level} ${source}: ${message}`,
    metadata: null,
    createdAt: timestamp,
    updatedAt: null,
    ...overrides,
  }
}
