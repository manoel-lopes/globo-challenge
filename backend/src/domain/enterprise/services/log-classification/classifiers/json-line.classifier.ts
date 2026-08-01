import type { ClassifierStrategy } from '../classified-log-line'
import { normalizeLogLevel, parseTimestamp } from '../log-level.helper'

function parseJsonObject (rawLine: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(rawLine)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null
    }
    return Object.fromEntries(Object.entries(parsed))
  } catch {
    return null
  }
}

export const jsonLineClassifier: ClassifierStrategy = {
  name: 'json-line',
  classify (rawLine, importedAt) {
    const trimmed = rawLine.trim()
    if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null
    const parsed = parseJsonObject(trimmed)
    if (!parsed) return null
    const levelValue = parsed.level ?? parsed.severity ?? parsed.Level ?? parsed.Severity
    const level = normalizeLogLevel(levelValue) ?? 'UNKNOWN'
    const timestamp = parseTimestamp(
      parsed.timestamp ?? parsed.time ?? parsed.ts ?? parsed['@timestamp'],
      importedAt
    )
    const sourceValue = parsed.source ?? parsed.service ?? parsed.host ?? parsed.logger
    const source = typeof sourceValue === 'string' ? sourceValue : null
    const messageValue = parsed.message ?? parsed.msg ?? parsed.text
    const message = typeof messageValue === 'string' ? messageValue : trimmed
    const reserved = new Set([
      'level', 'severity', 'Level', 'Severity',
      'timestamp', 'time', 'ts', '@timestamp',
      'source', 'service', 'host', 'logger',
      'message', 'msg', 'text',
    ])
    const metadata: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (!reserved.has(key)) metadata[key] = value
    }
    return {
      level,
      timestamp,
      source,
      message,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      rawLine,
      failed: level === 'UNKNOWN' && !normalizeLogLevel(levelValue),
    }
  },
}
