import type { Entity } from '@/core/domain/entity'
import type { Props } from '@/shared/types/props'

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'UNKNOWN'

export type LogEntryProps = Props<LogEntry>

export interface LogEntry extends Entity {
  logFileId: string
  level: LogLevel
  timestamp: Date
  source?: string | null
  message: string
  rawLine: string
  metadata?: Record<string, unknown> | null
}
