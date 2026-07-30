import { createHash } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import { mkdir, stat, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { Inject, Injectable } from '@nestjs/common'
import { UseCase } from '@/core/domain/application/use-case'
import { LogFilesRepository } from '@/domain/application/repositories/log-files.repository'
import type { LogFile } from '@/domain/enterprise/entities/log-file.entity'
import { ProcessLogFileUseCase } from '../process-log-file/process-log-file.usecase'
import { DuplicateLogFileError } from './errors/duplicate-log-file.error'
import { FileTooLargeError } from './errors/file-too-large.error'
import { MissingLogFileError } from './errors/missing-log-file.error'
import { UnsupportedFileTypeError } from './errors/unsupported-file-type.error'

const ALLOWED_EXTENSIONS = ['.log', '.txt', '.jsonl', '.json']

export type ImportLogFileRequest = {
  filename: string
  mimetype?: string
  fileSize?: number
  maxSize: number
  syncMaxBytes: number
  tempDir?: string
  stream: Readable
  isTruncated?: () => boolean
}

@Injectable()
export class ImportLogFileUseCase implements UseCase {
  constructor (
    @Inject(LogFilesRepository) private readonly logFilesRepository: LogFilesRepository,
    private readonly processLogFileUseCase: ProcessLogFileUseCase
  ) {}

  async execute (req: ImportLogFileRequest): Promise<LogFile> {
    if (!req.filename) {
      throw new MissingLogFileError()
    }
    if (!this.isSupportedFilename(req.filename)) {
      throw new UnsupportedFileTypeError(req.filename)
    }
    if (typeof req.fileSize === 'number' && req.fileSize > req.maxSize) {
      throw new FileTooLargeError(req.maxSize)
    }
    const logFile = await this.logFilesRepository.create({
      filename: req.filename,
      status: 'PENDING',
    })
    const tempDir = req.tempDir || tmpdir()
    await mkdir(tempDir, { recursive: true })
    const filePath = join(tempDir, `${logFile.id}.upload`)
    try {
      const checksum = await this.spoolToDisk(req.stream, filePath)
      const fileStats = await stat(filePath)
      if (fileStats.size > req.maxSize || req.isTruncated?.()) {
        await this.failAndCleanup(logFile.id, filePath)
        throw new FileTooLargeError(req.maxSize)
      }
      const duplicate = await this.logFilesRepository.findDuplicateByChecksum(checksum)
      if (duplicate) {
        await this.discardUpload(logFile.id, filePath)
        throw new DuplicateLogFileError(duplicate.id)
      }
      const spooled = await this.logFilesRepository.update(logFile.id, {
        checksum,
        sizeBytes: fileStats.size,
      })
      if (fileStats.size <= req.syncMaxBytes) {
        return this.processLogFileUseCase.execute({
          logFileId: logFile.id,
          filePath,
        })
      }
      setImmediate(() => {
        this.processLogFileUseCase
          .execute({ logFileId: logFile.id, filePath })
          .catch(() => {})
      })
      return spooled
    } catch (error) {
      if (error instanceof FileTooLargeError || error instanceof DuplicateLogFileError) {
        throw error
      }
      const current = await this.logFilesRepository.findById(logFile.id)
      if (current && (current.status === 'PENDING' || current.status === 'PROCESSING')) {
        await this.failAndCleanup(logFile.id, filePath)
      }
      throw error
    }
  }

  private async spoolToDisk (stream: Readable, filePath: string): Promise<string> {
    const hash = createHash('sha256')
    await pipeline(
      stream,
      async function * teeChecksum (source: AsyncIterable<Buffer | string>) {
        for await (const chunk of source) {
          hash.update(chunk)
          yield chunk
        }
      },
      createWriteStream(filePath)
    )
    return hash.digest('hex')
  }

  private async failAndCleanup (logFileId: string, filePath: string): Promise<void> {
    await this.removeTempFile(filePath)
    await this.logFilesRepository.update(logFileId, {
      status: 'FAILED',
      processedAt: new Date(),
    })
  }

  private async discardUpload (logFileId: string, filePath: string): Promise<void> {
    await this.removeTempFile(filePath)
    await this.logFilesRepository.delete(logFileId)
  }

  private async removeTempFile (filePath: string): Promise<void> {
    try {
      await unlink(filePath)
    } catch {}
  }

  private isSupportedFilename (filename: string): boolean {
    const lower = filename.toLowerCase()
    return ALLOWED_EXTENSIONS.some((extension) => lower.endsWith(extension))
  }
}
