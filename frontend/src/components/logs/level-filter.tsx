import { ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { LogLevel } from '@/core/domain/entities/log-entry'
import { cn } from '@/lib/utils'
import { LOG_LEVEL_ORDER } from '@/util/log-level'

interface LevelFilterProps {
  value: LogLevel[]
  onChange: (levels: LogLevel[]) => void
  className?: string
}

export function LevelFilter({ value, onChange, className }: LevelFilterProps) {
  const selected = new Set(value)

  function toggle(level: LogLevel) {
    const next = new Set(selected)
    if (next.has(level)) next.delete(level)
    else next.add(level)
    onChange(LOG_LEVEL_ORDER.filter((item) => next.has(item)))
  }

  const label =
    value.length === 0
      ? 'All levels'
      : value.length === 1
        ? value[0]
        : `${value.length} levels`

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className={cn('justify-start gap-2 font-normal', className)}>
          <ListFilter className='size-4 text-muted-foreground' />
          <span className='truncate'>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-44'>
        <DropdownMenuLabel>Severity</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOG_LEVEL_ORDER.map((level) => (
          <DropdownMenuCheckboxItem
            key={level}
            checked={selected.has(level)}
            onCheckedChange={() => toggle(level)}
            onSelect={(event) => event.preventDefault()}
          >
            <span className='font-mono text-xs'>{level}</span>
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
