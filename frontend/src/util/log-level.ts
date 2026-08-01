import type { LogLevel } from '@/core/domain/entities/log-entry'

export const LOG_LEVEL_ORDER: LogLevel[] = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL', 'UNKNOWN']

export const LOG_LEVEL_CHART_COLORS: Record<LogLevel, string> = {
  TRACE: 'var(--chart-trace)',
  DEBUG: 'var(--chart-debug)',
  INFO: 'var(--chart-info)',
  WARN: 'var(--chart-warn)',
  ERROR: 'var(--chart-error)',
  FATAL: 'var(--chart-fatal)',
  UNKNOWN: 'var(--chart-unknown)',
}

export const LOG_LEVEL_BADGE_CLASSES: Record<LogLevel, string> = {
  TRACE: 'bg-muted text-muted-foreground border-transparent',
  DEBUG: 'bg-blue-500/15 text-blue-600 border-transparent dark:text-blue-400',
  INFO: 'bg-sky-500/15 text-sky-600 border-transparent dark:text-sky-400',
  WARN: 'bg-amber-500/15 text-amber-600 border-transparent dark:text-amber-400',
  ERROR: 'bg-red-500/15 text-red-600 border-transparent dark:text-red-400',
  FATAL: 'bg-red-700/20 text-red-700 border-transparent font-semibold dark:text-red-400',
  UNKNOWN: 'bg-muted text-muted-foreground border-transparent',
}

export function isErrorLevel(level: LogLevel): boolean {
  return level === 'ERROR' || level === 'FATAL'
}
