import type { LogLevel } from '@/core/domain/entities/log-entry'

export interface DashboardSummary {
  totalEntries: number
  countsByLevel: Record<LogLevel, number>
  distinctSources: number
  filesProcessed: number
}
