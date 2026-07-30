import type { LogLevel } from '@/domain/enterprise/entities/log-entry.entity'

const LEVEL_ALIASES: Record<string, LogLevel> = {
  TRACE: 'TRACE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  INFORMATION: 'INFO',
  WARN: 'WARN',
  WARNING: 'WARN',
  ERROR: 'ERROR',
  ERR: 'ERROR',
  FATAL: 'FATAL',
  CRITICAL: 'FATAL',
  UNKNOWN: 'UNKNOWN',
}

export function normalizeLogLevel (value: unknown): LogLevel | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().toUpperCase()
  return LEVEL_ALIASES[normalized] ?? null
}

export function detectLevelKeyword (rawLine: string): LogLevel | null {
  const match = rawLine.match(/\b(TRACE|DEBUG|INFO|INFORMATION|WARN|WARNING|ERROR|ERR|FATAL|CRITICAL)\b/i)
  if (!match) return null
  return normalizeLogLevel(match[1])
}

export function parseTimestamp (value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromNumber = new Date(value)
    if (!Number.isNaN(fromNumber.getTime())) return fromNumber
  }
  if (typeof value === 'string' && value.trim()) {
    const fromString = new Date(value)
    if (!Number.isNaN(fromString.getTime())) return fromString
  }
  return fallback
}
