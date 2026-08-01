export const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'UNKNOWN'] as const

export type LogLevel = (typeof LOG_LEVELS)[number]

export interface LogEntry {
  id: string
  logFileId: string
  level: LogLevel
  timestamp: string
  source: string | null
  message: string
  rawLine: string
  metadata: Record<string, unknown> | null
  createdAt: string
  updatedAt: string | null
}
