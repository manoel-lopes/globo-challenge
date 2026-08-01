import { formatNumber } from '@/util/format-number'

interface TooltipPayloadItem {
  name?: string
  value?: number | string
  color?: string
  dataKey?: string | number
}

interface ChartTooltipProps {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  labelFormatter?: (label: string) => string
  hideTotal?: boolean
}

export function ChartTooltip({ active, payload, label, labelFormatter, hideTotal }: ChartTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const rows = payload.filter((item) => typeof item.value === 'number' && item.value !== 0)
  if (rows.length === 0) return null

  const total = rows.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0)

  return (
    <div className='min-w-40 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md'>
      {label ? (
        <p className='mb-1.5 font-medium text-popover-foreground'>
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      ) : null}
      <div className='space-y-1'>
        {rows.map((item) => (
          <div key={String(item.dataKey ?? item.name)} className='flex items-center justify-between gap-4'>
            <span className='flex items-center gap-1.5 text-muted-foreground'>
              <span className='size-2 rounded-[2px]' style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className='font-medium tabular-nums text-popover-foreground'>
              {formatNumber(Number(item.value))}
            </span>
          </div>
        ))}
      </div>
      {!hideTotal && rows.length > 1 ? (
        <div className='mt-1.5 flex items-center justify-between gap-4 border-t pt-1.5 text-muted-foreground'>
          <span>Total</span>
          <span className='font-medium tabular-nums text-popover-foreground'>{formatNumber(total)}</span>
        </div>
      ) : null}
    </div>
  )
}
