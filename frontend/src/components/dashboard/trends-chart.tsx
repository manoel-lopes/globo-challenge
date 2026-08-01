import { useMemo } from 'react'
import { LineChart as LineChartIcon } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DashboardTrends } from '@/core/domain/entities/dashboard-trends'
import type { LogLevel } from '@/core/domain/entities/log-entry'
import { ChartTooltip } from '@/components/dashboard/chart-tooltip'
import { EmptyState } from '@/components/shared/empty-state'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatShortDate } from '@/util/format-date'
import { formatNumber } from '@/util/format-number'
import { LOG_LEVEL_CHART_COLORS, LOG_LEVEL_ORDER } from '@/util/log-level'

interface TrendsChartProps {
  data?: DashboardTrends
  isLoading: boolean
  bucket: 'hour' | 'day'
  onBucketChange: (bucket: 'hour' | 'day') => void
}

export function TrendsChart({ data, isLoading, bucket, onBucketChange }: TrendsChartProps) {
  const { rows, levels } = useMemo(() => {
    if (!data) return { rows: [], levels: [] as LogLevel[] }
    const activeLevels = new Set<LogLevel>()
    const mapped = data.series.map((point) => {
      const row: Record<string, string | number> = { bucket: point.bucket, total: point.total }
      for (const level of LOG_LEVEL_ORDER) {
        const count = point.countsByLevel?.[level] ?? 0
        if (count > 0) activeLevels.add(level)
        row[level] = count
      }
      return row
    })
    const levels = LOG_LEVEL_ORDER.filter((level) => activeLevels.has(level))
    return { rows: mapped, levels }
  }, [data])
  return (
    <Card className='gap-4'>
      <CardHeader>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='space-y-1'>
            <CardTitle>Event trends</CardTitle>
            <CardDescription>Log volume over time, broken down by level</CardDescription>
          </div>
          <Tabs value={bucket} onValueChange={(value) => onBucketChange(value as 'hour' | 'day')}>
            <TabsList>
              <TabsTrigger value='hour'>Hourly</TabsTrigger>
              <TabsTrigger value='day'>Daily</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-72 w-full' />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={LineChartIcon}
            title='No trend data'
            description='Import log files to visualize event trends over time.'
            className='h-72'
          />
        ) : (
          <ResponsiveContainer width='100%' height={288}>
            <AreaChart data={rows} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                {levels.map((level) => (
                  <linearGradient key={level} id={`fill-${level}`} x1='0' y1='0' x2='0' y2='1'>
                    <stop offset='5%' stopColor={LOG_LEVEL_CHART_COLORS[level]} stopOpacity={0.35} />
                    <stop offset='95%' stopColor={LOG_LEVEL_CHART_COLORS[level]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis
                dataKey='bucket'
                tickFormatter={formatShortDate}
                tickLine={false}
                axisLine={false}
                minTickGap={32}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatNumber}
                tickLine={false}
                axisLine={false}
                width={56}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
              <Tooltip
                content={<ChartTooltip labelFormatter={formatShortDate} />}
                cursor={{ stroke: 'var(--border)' }}
              />
              {levels.map((level) => (
                <Area
                  key={level}
                  type='monotone'
                  dataKey={level}
                  stackId='level'
                  name={level}
                  stroke={LOG_LEVEL_CHART_COLORS[level]}
                  strokeWidth={1.5}
                  fill={`url(#fill-${level})`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
