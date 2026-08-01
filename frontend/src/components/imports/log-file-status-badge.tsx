import type { LogFileStatus } from '@/core/domain/entities/log-file'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface LogFileStatusBadgeProps {
  status: LogFileStatus
  className?: string
}

const STATUS_CLASSES: Record<LogFileStatus, string> = {
  PENDING: 'bg-muted text-muted-foreground border-transparent',
  PROCESSING: 'bg-sky-500/15 text-sky-600 border-transparent dark:text-sky-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-700 border-transparent dark:text-emerald-400',
  FAILED: 'bg-red-500/15 text-red-600 border-transparent dark:text-red-400',
}

export function LogFileStatusBadge({ status, className }: LogFileStatusBadgeProps) {
  return (
    <Badge className={cn('font-mono text-[0.7rem] tracking-wide', STATUS_CLASSES[status], className)}>
      {status}
    </Badge>
  )
}
