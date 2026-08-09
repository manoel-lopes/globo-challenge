import { useMemo, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import { z } from 'zod'
import type { LogLevel } from '@/core/domain/entities/log-entry'
import { LevelFilter } from '@/components/logs/level-filter'
import { LogEntriesTable } from '@/components/logs/log-entries-table'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { LogFileSelect } from '@/components/shared/log-file-select'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/util/useDebouncedValue'
import { type DateRange, type DateRangePresetId, resolvePresetRange } from '@/util/date-range'

const logsSearchSchema = z.object({
  logFileId: z.uuid().optional(),
})

export const Route = createFileRoute('/logs')({
  validateSearch: logsSearchSchema,
  component: LogsPage,
})

function LogsPage() {
  const { logFileId: searchLogFileId } = Route.useSearch()
  const navigate = Route.useNavigate()

  const [preset, setPreset] = useState<DateRangePresetId>('all')
  const [range, setRange] = useState<DateRange>(() => resolvePresetRange('all'))
  const [levels, setLevels] = useState<LogLevel[]>([])
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query)

  const filters = useMemo(
    () => ({
      logFileId: searchLogFileId,
      from: range.from,
      to: range.to,
      level: levels.length > 0 ? levels : undefined,
      q: debouncedQuery.trim() || undefined,
    }),
    [searchLogFileId, range.from, range.to, levels, debouncedQuery],
  )
  return (
    <div className='mx-auto flex max-w-7xl flex-col gap-6'>
      <header className='space-y-1'>
        <h1 className='text-2xl font-semibold tracking-tight text-balance'>Logs</h1>
        <p className='text-sm text-muted-foreground'>
          Browse, filter, and inspect classified log entries.
        </p>
      </header>
      <div className='flex flex-col gap-2 lg:flex-row lg:flex-wrap'>
        <LogFileSelect
          value={searchLogFileId}
          onChange={(logFileId) => {
            navigate({
              search: (prev) => ({ ...prev, logFileId }),
              replace: true,
            })
          }}
          className='w-full lg:w-52'
        />
        <LevelFilter value={levels} onChange={setLevels} className='w-full lg:w-44' />
        <DateRangeFilter
          value={preset}
          onChange={(nextPreset, nextRange) => {
            setPreset(nextPreset)
            setRange(nextRange)
          }}
          className='w-full lg:w-44'
        />
        <div className='relative w-full flex-1 lg:min-w-56'>
          <Search className='pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground' />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder='Search message or raw line…'
            className='pl-9'
            aria-label='Search logs'
          />
        </div>
      </div>
      <LogEntriesTable filters={filters} />
    </div>
  )
}
