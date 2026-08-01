import { AlertTriangle, Database, FileCheck2, Network, TriangleAlert } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardSummary } from '@/core/domain/entities/dashboard-summary'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/util/format-number'

interface SummaryCardsProps {
  data?: DashboardSummary
  isLoading: boolean
}

interface Indicator {
  key: string
  label: string
  value: number
  icon: typeof Database
  accent: string
}

function buildIndicators(data: DashboardSummary): Indicator[] {
  const errors = (data.countsByLevel.ERROR ?? 0) + (data.countsByLevel.FATAL ?? 0)
  const warnings = data.countsByLevel.WARN ?? 0
  return [
    { key: 'total', label: 'Total entries', value: data.totalEntries, icon: Database, accent: 'text-primary' },
    { key: 'errors', label: 'Errors & fatals', value: errors, icon: TriangleAlert, accent: 'text-chart-error' },
    { key: 'warnings', label: 'Warnings', value: warnings, icon: AlertTriangle, accent: 'text-chart-warn' },
    { key: 'sources', label: 'Distinct sources', value: data.distinctSources, icon: Network, accent: 'text-chart-info' },
    { key: 'files', label: 'Files processed', value: data.filesProcessed, icon: FileCheck2, accent: 'text-success' },
  ]
}

export function SummaryCards({ data, isLoading }: SummaryCardsProps) {
  if (isLoading || !data) {
    return (
      <div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className='space-y-3'>
              <Skeleton className='size-9 rounded-md' />
              <Skeleton className='h-7 w-20' />
              <Skeleton className='h-4 w-24' />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const indicators = buildIndicators(data)

  return (
    <div className='grid grid-cols-2 gap-4 lg:grid-cols-5'>
      {indicators.map((indicator) => {
        const Icon = indicator.icon
        return (
          <Card key={indicator.key}>
            <CardContent className='space-y-2'>
              <span
                className={cn(
                  'flex size-9 items-center justify-center rounded-md bg-muted',
                  indicator.accent,
                )}
              >
                <Icon className='size-4.5' />
              </span>
              <p className='text-2xl font-semibold tabular-nums tracking-tight'>
                {formatNumber(indicator.value)}
              </p>
              <p className='text-sm text-muted-foreground'>{indicator.label}</p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
