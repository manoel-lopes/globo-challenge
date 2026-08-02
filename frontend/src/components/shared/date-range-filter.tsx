import { CalendarClock } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DATE_RANGE_PRESETS, type DateRangePresetId, resolvePresetRange } from '@/util/date-range'

interface DateRangeFilterProps {
  value: DateRangePresetId
  onChange: (preset: DateRangePresetId, range: { from?: string; to?: string }) => void
  className?: string
}

export function DateRangeFilter({ value, onChange, className }: DateRangeFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as DateRangePresetId, resolvePresetRange(next as DateRangePresetId))}
    >
      <SelectTrigger className={className} aria-label='Time range'>
        <CalendarClock className='size-4 text-muted-foreground' />
        <SelectValue placeholder='Time range' />
      </SelectTrigger>
      <SelectContent>
        {DATE_RANGE_PRESETS.map((preset) => (
          <SelectItem key={preset.id} value={preset.id}>
            {preset.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
