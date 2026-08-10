import { Entity } from '@/core/domain/entity'
import type { Props } from '@/shared/types/props'

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'UNKNOWN'

export type LogEntryProps = Props<LogEntry>

export class LogEntry extends Entity {
  readonly logFileId: string
  readonly level: LogLevel
  readonly timestamp: Date
  readonly source: string | null
  readonly message: string
  readonly rawLine: string
  readonly metadata: Record<string, unknown> | null

  private constructor (props: LogEntryProps, id?: string) {
    super(id)
    Object.assign(this, props)
  }

  static create (props: LogEntryProps, id?: string): LogEntry {
    return new LogEntry(props, id)
  }

  toJSON () {
    return {
      id: this.id,
      logFileId: this.logFileId,
      level: this.level,
      timestamp: this.timestamp,
      source: this.source,
      message: this.message,
      rawLine: this.rawLine,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
