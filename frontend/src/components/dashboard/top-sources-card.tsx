import { ServerCog } from 'lucide-react'
import type { TopSource } from '@/core/domain/entities/top-source'
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
import { formatNumber, formatPercent } from '@/util/format-number'
import { cn } from '@/lib/utils'

interface TopSourcesCardProps {
  data?: TopSource[]
  isLoading: boolean
  by: 'volume' | 'errorRate'
  onByChange: (by: 'volume' | 'errorRate') => void
}

export function TopSourcesCard({ data, isLoading, by, onByChange }: TopSourcesCardProps) {
  const sources = data ?? []
  const maxTotal = Math.max(1, ...sources.map((source) => source.total))
  return (
    <Card className='gap-4'>
      <CardHeader>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div className='space-y-1'>
            <CardTitle>Top sources</CardTitle>
            <CardDescription>Most active sources by {by === 'volume' ? 'volume' : 'error rate'}</CardDescription>
          </div>
          <Tabs value={by} onValueChange={(value) => onByChange(value as 'volume' | 'errorRate')}>
            <TabsList>
              <TabsTrigger value='volume'>Volume</TabsTrigger>
              <TabsTrigger value='errorRate'>Error rate</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className='h-9 w-full' />
            ))}
          </div>
        ) : sources.length === 0 ? (
          <EmptyState
            icon={ServerCog}
            title='No sources found'
            description='Sources are extracted automatically from imported logs.'
          />
        ) : (
          <ul className='space-y-3'>
            {sources.map((source) => (
              <li key={source.source} className='space-y-1.5'>
                <div className='flex items-center justify-between gap-3 text-sm'>
                  <span className='truncate font-medium'>{source.source}</span>
                  <span className='flex shrink-0 items-center gap-2 text-muted-foreground tabular-nums'>
                    <span>{formatNumber(source.total)}</span>
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-xs',
                        source.errorRate > 0
                          ? 'bg-chart-error/10 text-chart-error'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {formatPercent(source.errorRate)}
                    </span>
                  </span>
                </div>
                <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-primary'
                    style={{ width: `${Math.max(2, (source.total / maxTotal) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
