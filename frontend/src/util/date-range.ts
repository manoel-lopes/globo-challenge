import { subDays, subHours } from 'date-fns'

export interface DateRange {
  from?: string
  to?: string
}

export type DateRangePresetId = '24h' | '7d' | '30d' | '90d' | 'all' | 'custom'

interface DateRangePreset {
  id: DateRangePresetId
  label: string
}

export const DATE_RANGE_PRESETS: DateRangePreset[] = [
  { id: '24h', label: 'Last 24 hours' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: '90d', label: 'Last 90 days' },
  { id: 'all', label: 'All time' },
]

export function resolvePresetRange(preset: DateRangePresetId): DateRange {
  const now = new Date()
  switch (preset) {
    case '24h':
      return { from: subHours(now, 24).toISOString(), to: now.toISOString() }
    case '7d':
      return { from: subDays(now, 7).toISOString(), to: now.toISOString() }
    case '30d':
      return { from: subDays(now, 30).toISOString(), to: now.toISOString() }
    case '90d':
      return { from: subDays(now, 90).toISOString(), to: now.toISOString() }
    default:
      return {}
  }
}
