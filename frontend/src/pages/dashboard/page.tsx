import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LevelDistribution } from '@/components/dashboard/level-distribution'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { TopSourcesCard } from '@/components/dashboard/top-sources-card'
import { TrendsChart } from '@/components/dashboard/trends-chart'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { LogFileSelect } from '@/components/shared/log-file-select'
import { useGetDashboardSummary } from '@/hooks/application/useGetDashboardSummary'
import { useGetDashboardTrends } from '@/hooks/application/useGetDashboardTrends'
import { useGetTopSources } from '@/hooks/application/useGetTopSources'
import { type DateRange, type DateRangePresetId, resolvePresetRange } from '@/util/date-range'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const [preset, setPreset] = useState<DateRangePresetId>('7d')
  const [range, setRange] = useState<DateRange>(() => resolvePresetRange('7d'))
  const [logFileId, setLogFileId] = useState<string | undefined>(undefined)
  const [bucket, setBucket] = useState<'hour' | 'day'>('day')
  const [topSourcesBy, setTopSourcesBy] = useState<'volume' | 'errorRate'>('volume')

  const filters = useMemo(
    () => ({ from: range.from, to: range.to, logFileId }),
    [range.from, range.to, logFileId],
  )

  const summaryQuery = useGetDashboardSummary(filters)
  const trendsQuery = useGetDashboardTrends({ ...filters, bucket, splitByLevel: true })
  const topSourcesQuery = useGetTopSources({ ...filters, by: topSourcesBy, limit: 8 })

  return (
    <div className='mx-auto flex max-w-7xl flex-col gap-6'>
      <header className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-semibold tracking-tight text-balance'>Dashboard</h1>
          <p className='text-sm text-muted-foreground'>
            Monitor log volume, severity distribution, and the noisiest sources.
          </p>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row'>
          <LogFileSelect value={logFileId} onChange={setLogFileId} className='w-full sm:w-52' />
          <DateRangeFilter
            value={preset}
            onChange={(nextPreset, nextRange) => {
              setPreset(nextPreset)
              setRange(nextRange)
            }}
            className='w-full sm:w-44'
          />
        </div>
      </header>

      <SummaryCards data={summaryQuery.data} isLoading={summaryQuery.isPending} />

      <TrendsChart
        data={trendsQuery.data}
        isLoading={trendsQuery.isPending}
        bucket={bucket}
        onBucketChange={setBucket}
      />

      <div className='grid gap-6 lg:grid-cols-2'>
        <LevelDistribution data={summaryQuery.data} isLoading={summaryQuery.isPending} />
        <TopSourcesCard
          data={topSourcesQuery.data}
          isLoading={topSourcesQuery.isPending}
          by={topSourcesBy}
          onByChange={setTopSourcesBy}
        />
      </div>
    </div>
  )
}
