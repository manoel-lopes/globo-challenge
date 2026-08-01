import type { Entity } from '@/core/domain/entity'
import { LogFileName } from '@/domain/enterprise/value-objects/log-file/log-file-name.vo'

export type LogFileStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type LogFileProps = {
  filename: string
  status: LogFileStatus
  checksum?: string | null
  sizeBytes?: number | null
  totalLines: number
  processedLines: number
  failedLines: number
  processedAt?: Date | null
  createdAt: Date
  updatedAt?: Date | null
}

export type LogFileSnapshot = Entity & LogFileProps

type CreateLogFileInput = {
  filename: string
  id?: string
  createdAt?: Date
}

type RestoreLogFileInput = LogFileSnapshot

export class LogFile implements Entity {
  private constructor (
    readonly id: string,
    private props: LogFileProps
  ) {}

  static create (input: CreateLogFileInput): LogFile {
    const filename = LogFileName.create(input.filename).value
    const now = input.createdAt ?? new Date()
    return new LogFile(input.id ?? cryptoRandomId(), {
      filename,
      status: 'PENDING',
      checksum: null,
      sizeBytes: null,
      totalLines: 0,
      processedLines: 0,
      failedLines: 0,
      processedAt: null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static restore (input: RestoreLogFileInput): LogFile {
    return new LogFile(input.id, {
      filename: input.filename,
      status: input.status,
      checksum: input.checksum ?? null,
      sizeBytes: input.sizeBytes ?? null,
      totalLines: input.totalLines,
      processedLines: input.processedLines,
      failedLines: input.failedLines,
      processedAt: input.processedAt ?? null,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt ?? null,
    })
  }

  get filename (): string {
    return this.props.filename
  }

  get status (): LogFileStatus {
    return this.props.status
  }

  get checksum (): string | null {
    return this.props.checksum ?? null
  }

  get sizeBytes (): number | null {
    return this.props.sizeBytes ?? null
  }

  get totalLines (): number {
    return this.props.totalLines
  }

  get processedLines (): number {
    return this.props.processedLines
  }

  get failedLines (): number {
    return this.props.failedLines
  }

  get processedAt (): Date | null {
    return this.props.processedAt ?? null
  }

  get createdAt (): Date {
    return this.props.createdAt
  }

  get updatedAt (): Date | null {
    return this.props.updatedAt ?? null
  }

  stage (checksum: string, sizeBytes: number): void {
    this.props.checksum = checksum
    this.props.sizeBytes = sizeBytes
    this.touch()
  }

  startProcessing (): void {
    if (this.props.status === 'COMPLETED' || this.props.status === 'PROCESSING') {
      throw new Error('Cannot process a completed or already processing log file')
    }
    this.props.status = 'PROCESSING'
    this.touch()
  }

  recordProgress (totalLines: number, processedLines: number, failedLines: number): void {
    this.props.totalLines = totalLines
    this.props.processedLines = processedLines
    this.props.failedLines = failedLines
    this.touch()
  }

  complete (
    totalLines: number,
    processedLines: number,
    failedLines: number,
    processedAt: Date
  ): void {
    this.props.status = 'COMPLETED'
    this.props.totalLines = totalLines
    this.props.processedLines = processedLines
    this.props.failedLines = failedLines
    this.props.processedAt = processedAt
    this.touch()
  }

  fail (
    processedAt: Date,
    counters?: {
      totalLines?: number
      processedLines?: number
      failedLines?: number
    }
  ): void {
    this.props.status = 'FAILED'
    this.props.processedAt = processedAt
    if (counters?.totalLines !== undefined) this.props.totalLines = counters.totalLines
    if (counters?.processedLines !== undefined) {
      this.props.processedLines = counters.processedLines
    }
    if (counters?.failedLines !== undefined) this.props.failedLines = counters.failedLines
    this.touch()
  }

  isActiveUpload (): boolean {
    return this.props.status === 'PENDING' || this.props.status === 'PROCESSING'
  }

  toJSON (): LogFileSnapshot {
    return {
      id: this.id,
      filename: this.props.filename,
      status: this.props.status,
      checksum: this.props.checksum ?? null,
      sizeBytes: this.props.sizeBytes ?? null,
      totalLines: this.props.totalLines,
      processedLines: this.props.processedLines,
      failedLines: this.props.failedLines,
      processedAt: this.props.processedAt ?? null,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt ?? null,
    }
  }

  private touch (): void {
    this.props.updatedAt = new Date()
  }
}

function cryptoRandomId (): string {
  return globalThis.crypto.randomUUID()
}
