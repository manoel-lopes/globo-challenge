import type { LogLevel } from '@/domain/enterprise/entities/log-entry.entity'

export type ClassifiedLogLine = {
  level: LogLevel
  timestamp: Date
  source: string | null
  message: string
  metadata: Record<string, unknown> | null
  rawLine: string
  failed: boolean
}

export type ClassifierStrategy = {
  name: string
  classify: (rawLine: string, importedAt: Date) => ClassifiedLogLine | null
}
