import type { Entity } from '@/core/domain/entity'

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'UNKNOWN'

export type LogEntryProps = {
  logFileId: string
  level: LogLevel
  timestamp: Date
  source?: string | null
  message: string
  rawLine: string
  metadata?: Record<string, unknown> | null
  createdAt: Date
  updatedAt?: Date | null
}

export type LogEntrySnapshot = Entity & LogEntryProps

type CreateLogEntryInput = {
  logFileId: string
  level: LogLevel
  timestamp: Date
  source?: string | null
  message: string
  rawLine: string
  metadata?: Record<string, unknown> | null
  id?: string
  createdAt?: Date
}

export class LogEntry implements Entity {
  private constructor (
    readonly id: string,
    private readonly props: LogEntryProps
  ) {}

  static create (input: CreateLogEntryInput): LogEntry {
    const now = input.createdAt ?? new Date()
    return new LogEntry(input.id ?? globalThis.crypto.randomUUID(), {
      logFileId: input.logFileId,
      level: input.level,
      timestamp: input.timestamp,
      source: input.source ?? null,
      message: input.message,
      rawLine: input.rawLine,
      metadata: input.metadata ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore (input: LogEntrySnapshot): LogEntry {
    return new LogEntry(input.id, {
      logFileId: input.logFileId,
      level: input.level,
      timestamp: input.timestamp,
      source: input.source ?? null,
      message: input.message,
      rawLine: input.rawLine,
      metadata: input.metadata ?? null,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt ?? null,
    })
  }

  get logFileId (): string {
    return this.props.logFileId
  }

  get level (): LogLevel {
    return this.props.level
  }

  get timestamp (): Date {
    return this.props.timestamp
  }

  get source (): string | null {
    return this.props.source ?? null
  }

  get message (): string {
    return this.props.message
  }

  get rawLine (): string {
    return this.props.rawLine
  }

  get metadata (): Record<string, unknown> | null {
    return this.props.metadata ?? null
  }

  get createdAt (): Date {
    return this.props.createdAt
  }

  get updatedAt (): Date | null {
    return this.props.updatedAt ?? null
  }

  toJSON (): LogEntrySnapshot {
    return {
      id: this.id,
      logFileId: this.props.logFileId,
      level: this.props.level,
      timestamp: this.props.timestamp,
      source: this.props.source ?? null,
      message: this.props.message,
      rawLine: this.props.rawLine,
      metadata: this.props.metadata ?? null,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt ?? null,
    }
  }
}
