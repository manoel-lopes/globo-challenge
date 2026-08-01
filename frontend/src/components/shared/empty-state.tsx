import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center',
        className,
      )}
    >
      <span className='flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground'>
        <Icon className='size-5' />
      </span>
      <div className='space-y-1'>
        <p className='text-sm font-medium'>{title}</p>
        {description ? (
          <p className='mx-auto max-w-sm text-sm text-muted-foreground text-pretty'>{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}
