import { useMemo } from 'react'
import type { DashboardTrends } from '@/core/domain/entities/dashboard-trends'
import type { LogLevel } from '@/core/domain/entities/log-entry'
import { LOG_LEVEL_ORDER } from '@/util/log-level'

interface TrendsChartData {
  rows: Record<string, string | number>[]
  levels: LogLevel[]
}

export function useTrendsChart(data: DashboardTrends | undefined): TrendsChartData {
  return useMemo(() => {
    if (!data) return { rows: [], levels: [] }

    const activeLevels = new Set<LogLevel>()

    const rows = data.series.map((point) => {
      const row: Record<string, string | number> = {
        bucket: point.bucket,
        total: point.total,
      }

      for (const level of LOG_LEVEL_ORDER) {
        const count = point.countsByLevel?.[level] ?? 0
        if (count > 0) activeLevels.add(level)
        row[level] = count
      }

      return row
    })

    const levels = LOG_LEVEL_ORDER.filter((level) => activeLevels.has(level))
    return { rows, levels }
  }, [data])
}
