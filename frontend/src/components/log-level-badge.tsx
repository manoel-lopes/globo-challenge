import type { LogLevel } from '@/core/domain/entities/log-entry'
import { Badge } from '@/components/ui/badge'
import { LOG_LEVEL_BADGE_CLASSES } from '@/util/log-level'
import { cn } from '@/lib/utils'

interface LogLevelBadgeProps {
  level: LogLevel
  className?: string
}

export function LogLevelBadge({ level, className }: LogLevelBadgeProps) {
  return (
    <Badge className={cn('font-mono text-[0.7rem] tracking-wide', LOG_LEVEL_BADGE_CLASSES[level], className)}>
      {level}
    </Badge>
  )
}
