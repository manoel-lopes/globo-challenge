import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { mkdir, stat, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createInterface } from 'node:readline'
import type { Readable } from 'node:stream'
import { Readable as NodeReadable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import type { ClassifiedLogLine } from '@/domain/enterprise/services/log-classification/classified-log-line'
import { LogClassifierRegistry } from '@/domain/enterprise/services/log-classification/log-classifier.registry'

export type ParseLogStreamResult = {
  entries: ClassifiedLogLine[]
  totalLines: number
  failedLines: number
}

export type ParsedLogBatch = {
  batch: ClassifiedLogLine[]
  totalLines: number
  failedLines: number
  done: boolean
}

export class LogFileParser {
  constructor (private readonly classifier = new LogClassifierRegistry()) {}

  async parseStream (
    stream: Readable,
    importedAt: Date = new Date()
  ): Promise<ParseLogStreamResult> {
    const entries: ClassifiedLogLine[] = []
    let totalLines = 0
    let failedLines = 0
    const rl = createInterface({ input: stream, crlfDelay: Infinity })
    for await (const line of rl) {
      totalLines += 1
      const classified = this.classifier.classify(line, importedAt)
      if (classified.failed) failedLines += 1
      entries.push(classified)
    }
    return { entries, totalLines, failedLines }
  }

  async parseBuffer (
    buffer: Buffer,
    importedAt: Date = new Date()
  ): Promise<ParseLogStreamResult> {
    const stream = NodeReadable.from(buffer)
    return this.parseStream(stream, importedAt)
  }

  async * iterateBatches (
    stream: Readable,
    batchSize: number,
    importedAt: Date = new Date()
  ): AsyncGenerator<{
    batch: ClassifiedLogLine[]
    totalLines: number
    failedLines: number
    done: boolean
  }> {
    const rl = createInterface({ input: stream, crlfDelay: Infinity })
    let batch: ClassifiedLogLine[] = []
    let totalLines = 0
    let failedLines = 0
    for await (const line of rl) {
      totalLines += 1
      const classified = this.classifier.classify(line, importedAt)
      if (classified.failed) failedLines += 1
      batch.push(classified)
      if (batch.length >= batchSize) {
        yield { batch, totalLines, failedLines, done: false }
        batch = []
      }
    }
    yield { batch, totalLines, failedLines, done: true }
  }

  openReadStream (filePath: string): Readable {
    return createReadStream(filePath)
  }

  async removeFile (filePath: string): Promise<void> {
    try {
      await unlink(filePath)
    } catch {}
  }

  async ensureDir (dir: string): Promise<void> {
    await mkdir(dir, { recursive: true })
  }

  resolveUploadPath (tempDir: string | undefined, logFileId: string): string {
    return join(tempDir || this.defaultTempDir(), `${logFileId}.upload`)
  }

  async spoolToDisk (stream: Readable, filePath: string): Promise<string> {
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

  async getFileSize (filePath: string): Promise<number> {
    const fileStats = await stat(filePath)
    return fileStats.size
  }

  defaultTempDir (): string {
    return tmpdir()
  }
}
