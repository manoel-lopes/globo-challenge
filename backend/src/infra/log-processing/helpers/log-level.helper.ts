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
const YEARLESS_SYSLOG =
  /^(?<month>\w{3})\s+(?<day>\d{1,2})\s+(?<time>\d{2}:\d{2}:\d{2})$/
const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
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

function parseYearlessSyslog (value: string, fallback: Date): Date | null {
  const match = value.trim().match(YEARLESS_SYSLOG)
  if (!match?.groups) return null
  const month = MONTH_INDEX[match.groups.month]
  if (month === undefined) return null
  const day = Number.parseInt(match.groups.day, 10)
  const [hours, minutes, seconds] = match.groups.time.split(':').map((part) =>
    Number.parseInt(part, 10)
  )
  if ([day, hours, minutes, seconds].some((part) => Number.isNaN(part))) return null
  const withCurrentYear = new Date(Date.UTC(
    fallback.getUTCFullYear(),
    month,
    day,
    hours,
    minutes,
    seconds
  ))
  if (Number.isNaN(withCurrentYear.getTime())) return null

  if (withCurrentYear.getTime() > fallback.getTime()) {
    return new Date(Date.UTC(
      fallback.getUTCFullYear() - 1,
      month,
      day,
      hours,
      minutes,
      seconds
    ))
  }
  return withCurrentYear
}

export function parseTimestamp (value: unknown, fallback: Date): Date {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value
  if (typeof value === 'number' && Number.isFinite(value)) {
    const fromNumber = new Date(value)
    if (!Number.isNaN(fromNumber.getTime())) return fromNumber
  }
  if (typeof value === 'string' && value.trim()) {
    const yearless = parseYearlessSyslog(value, fallback)
    if (yearless) return yearless
    const fromString = new Date(value)
    if (!Number.isNaN(fromString.getTime())) return fromString
  }
  return fallback
}
