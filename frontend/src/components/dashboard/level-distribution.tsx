import { useMemo } from 'react'
import { PieChart as PieChartIcon } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
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
import type { DashboardSummary } from '@/core/domain/entities/dashboard-summary'
import { formatNumber, formatPercent } from '@/util/format-number'
import { LOG_LEVEL_CHART_COLORS, LOG_LEVEL_ORDER } from '@/util/log-level'

interface LevelDistributionProps {
  data?: DashboardSummary
  isLoading: boolean
}

export function LevelDistribution({ data, isLoading }: LevelDistributionProps) {
  const { slices, total } = useMemo(() => {
    if (!data) return { slices: [], total: 0 }
    const slices = LOG_LEVEL_ORDER.map((level) => ({
      level,
      name: level,
      value: data.countsByLevel[level] ?? 0,
      color: LOG_LEVEL_CHART_COLORS[level],
    })).filter((slice) => slice.value > 0)
    const total = slices.reduce((sum, slice) => sum + slice.value, 0)
    return { slices, total }
  }, [data])

  return (
    <Card className='gap-4'>
      <CardHeader>
        <CardTitle>Level distribution</CardTitle>
        <CardDescription>Share of entries by severity</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-64 w-full' />
        ) : slices.length === 0 ? (
          <EmptyState
            icon={PieChartIcon}
            title='No entries yet'
            description='Distribution appears once logs are processed.'
            className='h-64'
          />
        ) : (
          <div className='flex flex-col items-center gap-6 sm:flex-row'>
            <div className='relative size-44 shrink-0'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Tooltip content={<ChartTooltip hideTotal />} />
                  <Pie
                    data={slices}
                    dataKey='value'
                    nameKey='name'
                    innerRadius={54}
                    outerRadius={82}
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.level} fill={slice.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
                <span className='text-xl font-semibold tabular-nums'>{formatNumber(total)}</span>
                <span className='text-xs text-muted-foreground'>entries</span>
              </div>
            </div>
            <ul className='w-full flex-1 space-y-2'>
              {slices.map((slice) => (
                <li key={slice.level} className='flex items-center gap-2 text-sm'>
                  <span className='size-2.5 rounded-[3px]' style={{ backgroundColor: slice.color }} />
                  <span className='font-mono text-xs text-muted-foreground'>{slice.level}</span>
                  <span className='ml-auto font-medium tabular-nums'>{formatNumber(slice.value)}</span>
                  <span className='w-12 text-right text-xs text-muted-foreground tabular-nums'>
                    {formatPercent(slice.value / total)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
