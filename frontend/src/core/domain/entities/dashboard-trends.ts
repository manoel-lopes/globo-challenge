import type { LogLevel } from '@/core/domain/entities/log-entry'

export interface TrendBucket {
  bucket: string
  total: number
  countsByLevel?: Partial<Record<LogLevel, number>>
}

export interface DashboardTrends {
  bucket: 'hour' | 'day'
  series: TrendBucket[]
}
