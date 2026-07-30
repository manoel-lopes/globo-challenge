import type { Entity } from '@/core/domain/entity'
import type { Props } from '@/shared/types/props'

export type LogFileStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type LogFileProps = Props<LogFile>

export interface LogFile extends Entity {
  filename: string
  status: LogFileStatus
  checksum?: string | null
  sizeBytes?: number | null
  totalLines: number
  processedLines: number
  failedLines: number
  processedAt?: Date | null
}
