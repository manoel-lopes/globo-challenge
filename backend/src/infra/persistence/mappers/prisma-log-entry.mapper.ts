import type { LogEntry as PrismaLogEntry, Prisma } from '@prisma/client'
import { LogEntry } from '@/domain/enterprise/entities/log-entry/log-entry.entity'

export class PrismaLogEntryMapper {
  static toDomain (raw: PrismaLogEntry): LogEntry {
    return LogEntry.restore({
      id: raw.id,
      logFileId: raw.logFileId,
      level: raw.level,
      timestamp: raw.timestamp,
      source: raw.source,
      message: raw.message,
      rawLine: raw.rawLine,
      metadata: toMetadata(raw.metadata),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    })
  }

  static toCreateInput (entry: {
    logFileId: string
    level: LogEntry['level']
    timestamp: Date
    source?: string | null
    message: string
    rawLine: string
    metadata?: Record<string, unknown> | null
  }) {
    return {
      logFileId: entry.logFileId,
      level: entry.level,
      timestamp: entry.timestamp,
      source: entry.source ?? null,
      message: entry.message,
      rawLine: entry.rawLine,
      metadata: entry.metadata === null || entry.metadata === undefined
        ? undefined
        : entry.metadata,
    }
  }
}

function toMetadata (value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return Object.fromEntries(Object.entries(value))
}
