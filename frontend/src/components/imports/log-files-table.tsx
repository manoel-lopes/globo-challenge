import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronLeft, ChevronRight, FileStack } from 'lucide-react'
import { LogFileStatusBadge } from '@/components/imports/log-file-status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useGetLogFiles } from '@/hooks/application/useGetLogFiles'
import { formatDateTime, formatRelativeTime } from '@/util/format-date'
import { formatBytes, formatNumber } from '@/util/format-number'
import { getErrorMessage } from '@/util/get-error-message'

const PAGE_SIZE = 10

export function LogFilesTable() {
  const [page, setPage] = useState(1)
  const { data, isPending, isError, error, isFetching } = useGetLogFiles({
    page,
    pageSize: PAGE_SIZE,
    order: 'desc',
  })

  const files = data?.items ?? []
  const totalPages = data?.totalPages ?? 1

  if (isPending) {
    return (
      <div className='space-y-2 rounded-lg border p-2'>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className='h-10 w-full' />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <EmptyState
        icon={FileStack}
        title='Failed to load imports'
        description={getErrorMessage(error)}
      />
    )
  }

  if (files.length === 0) {
    return (
      <EmptyState
        icon={FileStack}
        title='No imports yet'
        description='Upload a log file to start analyzing entries.'
      />
    )
  }

  return (
    <div className='space-y-3'>
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead className='w-[8rem]'>Status</TableHead>
              <TableHead className='w-[7rem] text-right'>Lines</TableHead>
              <TableHead className='w-[7rem] text-right'>Failed</TableHead>
              <TableHead className='w-[8rem] text-right'>Size</TableHead>
              <TableHead className='w-[11rem]'>Created</TableHead>
              <TableHead className='w-[7rem]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id} className={isFetching ? 'opacity-80' : undefined}>
                <TableCell>
                  <div className='min-w-0'>
                    <p className='truncate font-medium'>{file.filename}</p>
                    <p className='text-xs text-muted-foreground'>
                      {file.processedAt
                        ? `Processed ${formatRelativeTime(file.processedAt)}`
                        : 'Awaiting processing'}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <LogFileStatusBadge status={file.status} />
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {formatNumber(file.processedLines)}
                  <span className='text-muted-foreground'>/{formatNumber(file.totalLines)}</span>
                </TableCell>
                <TableCell className='text-right tabular-nums'>
                  {formatNumber(file.failedLines)}
                </TableCell>
                <TableCell className='text-right text-muted-foreground tabular-nums'>
                  {file.sizeBytes != null ? formatBytes(file.sizeBytes) : '—'}
                </TableCell>
                <TableCell className='text-xs text-muted-foreground'>
                  {formatDateTime(file.createdAt)}
                </TableCell>
                <TableCell className='text-right'>
                  <Button asChild variant='ghost' size='sm'>
                    <Link to='/logs' search={{ logFileId: file.id }}>
                      View logs
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='flex items-center justify-between gap-3'>
        <p className='text-xs text-muted-foreground'>
          Page {page} of {totalPages}
          {data ? ` · ${formatNumber(data.totalItems)} files` : null}
        </p>
        <div className='flex items-center gap-1'>
          <Button
            variant='outline'
            size='icon-sm'
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            aria-label='Previous page'
          >
            <ChevronLeft className='size-4' />
          </Button>
          <Button
            variant='outline'
            size='icon-sm'
            disabled={page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
            aria-label='Next page'
          >
            <ChevronRight className='size-4' />
          </Button>
        </div>
      </div>
    </div>
  )
}
