import { normalizeLogLevel, parseTimestamp } from '../helpers/log-level.helper'
import type { ClassifierStrategy } from '../types/classified-log-line'

const BRACKETED_PATTERN =
  /^\[(?<timestamp>[^\]]+)\]\s+(?<level>[A-Za-z]+)\s+(?:(?<source>[\w./:@-]+)\s+)?(?<message>.*)$/
const SYSLOG_PATTERN =
  /^(?:<(?<priority>\d+)>)?(?<timestamp>\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}|\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)\s+(?<host>\S+)\s+(?<tag>[\w./-]+)(?::\s*|\s+)(?<message>.*)$/

export const plainTextClassifier: ClassifierStrategy = {
  name: 'plain-text',
  classify (rawLine, importedAt) {
    const bracketed = rawLine.match(BRACKETED_PATTERN)
    if (bracketed?.groups) {
      const level = normalizeLogLevel(bracketed.groups.level) ?? 'UNKNOWN'
      return {
        level,
        timestamp: parseTimestamp(bracketed.groups.timestamp, importedAt),
        source: bracketed.groups.source || null,
        message: bracketed.groups.message || rawLine,
        metadata: null,
        rawLine,
        failed: level === 'UNKNOWN',
      }
    }
    const syslog = rawLine.match(SYSLOG_PATTERN)
    if (syslog?.groups) {
      const priority = syslog.groups.priority
        ? Number.parseInt(syslog.groups.priority, 10)
        : null
      const levelFromPriority = priority === null
        ? null
        : mapSyslogPriority(priority)
      const levelInMessage = normalizeLogLevel(
        syslog.groups.message.match(/\b(TRACE|DEBUG|INFO|WARN|WARNING|ERROR|FATAL)\b/i)?.[1]
      )
      const level = levelFromPriority ?? levelInMessage ?? 'UNKNOWN'
      return {
        level,
        timestamp: parseTimestamp(syslog.groups.timestamp, importedAt),
        source: syslog.groups.tag || syslog.groups.host || null,
        message: syslog.groups.message || rawLine,
        metadata: priority === null ? null : { priority },
        rawLine,
        failed: level === 'UNKNOWN',
      }
    }
    return null
  },
}

function mapSyslogPriority (priority: number): ReturnType<typeof normalizeLogLevel> {
  const severity = priority % 8
  const severityMap: Record<number, NonNullable<ReturnType<typeof normalizeLogLevel>>> = {
    0: 'FATAL',
    1: 'FATAL',
    2: 'FATAL',
    3: 'ERROR',
    4: 'WARN',
    5: 'INFO',
    6: 'INFO',
    7: 'DEBUG',
  }
  return severityMap[severity] ?? null
}
