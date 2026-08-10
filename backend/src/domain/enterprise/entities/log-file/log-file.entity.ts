import { Entity } from '@/core/domain/entity'
import type { Props } from '@/shared/types/props'

export type LogFileStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type LogFileProps = Props<LogFile>

export class LogFile extends Entity {
  readonly filename: string
  readonly status: LogFileStatus
  readonly checksum: string | null
  readonly sizeBytes: number | null
  readonly totalLines: number
  readonly processedLines: number
  readonly failedLines: number
  readonly processedAt: Date | null

  private constructor (props: LogFileProps, id?: string) {
    super(id)
    Object.assign(this, props)
  }

  static create (props: LogFileProps, id?: string): LogFile {
    return new LogFile(props, id)
  }

  toJSON () {
    return {
      id: this.id,
      filename: this.filename,
      status: this.status,
      checksum: this.checksum,
      sizeBytes: this.sizeBytes,
      totalLines: this.totalLines,
      processedLines: this.processedLines,
      failedLines: this.failedLines,
      processedAt: this.processedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
