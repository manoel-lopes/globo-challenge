import { useEffect, useMemo, useRef, useState } from 'react'
import { ScrollText } from 'lucide-react'
import type { LogEntry } from '@/core/domain/entities/log-entry'
import { LogLevelBadge } from '@/components/log-level-badge'
import { LogEntryDetailDialog } from '@/components/logs/log-entry-detail-dialog'
import { EmptyState } from '@/components/shared/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGetLogs } from '@/hooks/application/useGetLogs'
import type { LogsFilters } from '@/util/build-log-filters'
import { formatDateTime } from '@/util/format-date'
import { getErrorMessage } from '@/util/get-error-message'

interface LogEntriesTableProps {
  filters: LogsFilters
}

export function LogEntriesTable({ filters }: LogEntriesTableProps) {
  const {
    data,
    isPending,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
  } = useGetLogs(filters)

  const entries = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  )

  const [selected, setSelected] = useState<LogEntry | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return

    const observer = new IntersectionObserver(
      (observed) => {
        if (observed[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '240px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  if (isPending) {
    return (
      <div className='space-y-2 rounded-lg border p-2'>
        {Array.from({ length: 8 }).map((_, index) => (
          <Skeleton key={index} className='h-10 w-full' />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={ScrollText}
        title='Failed to load logs'
        description={getErrorMessage(error)}
      />
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={ScrollText}
        title='No log entries found'
        description='Try adjusting filters or import a log file first.'
      />
    )
  }

  return (
    <>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[10rem]'>Timestamp</TableHead>
              <TableHead className='w-[6rem]'>Level</TableHead>
              <TableHead className='w-[9rem]'>Source</TableHead>
              <TableHead>Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow
                key={entry.id}
                className='cursor-pointer'
                onClick={() => setSelected(entry)}
              >
                <TableCell className='font-mono text-xs text-muted-foreground'>
                  {formatDateTime(entry.timestamp)}
                </TableCell>
                <TableCell>
                  <LogLevelBadge level={entry.level} />
                </TableCell>
                <TableCell className='max-w-[9rem] truncate text-sm'>
                  {entry.source ?? '—'}
                </TableCell>
                <TableCell className='max-w-0 truncate font-mono text-xs'>
                  {entry.message}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div ref={sentinelRef} className='flex h-10 items-center justify-center'>
          {isFetchingNextPage ? (
            <span className='text-xs text-muted-foreground'>Loading more…</span>
          ) : hasNextPage ? (
            <span className='text-xs text-muted-foreground'>Scroll for more</span>
          ) : (
            <span className='text-xs text-muted-foreground'>End of results</span>
          )}
        </div>
      </div>
      <LogEntryDetailDialog
        entry={selected}
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      />
    </>
  )
}
