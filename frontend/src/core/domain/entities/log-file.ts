export const LOG_FILE_STATUSES = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const

export type LogFileStatus = (typeof LOG_FILE_STATUSES)[number]

export interface LogFile {
  id: string
  filename: string
  status: LogFileStatus
  checksum: string | null
  sizeBytes: number | null
  totalLines: number
  processedLines: number
  failedLines: number
  processedAt: string | null
  createdAt: string
  updatedAt: string | null
}
