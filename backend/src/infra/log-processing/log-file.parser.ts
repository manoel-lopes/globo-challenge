import { createInterface } from 'node:readline'
import type { Readable } from 'node:stream'
import { Readable as NodeReadable } from 'node:stream'
import { LogClassifierRegistry } from './log-classifier.registry'
import type { ClassifiedLogLine } from './types/classified-log-line'

export type ParseLogStreamResult = {
  entries: ClassifiedLogLine[]
  totalLines: number
  failedLines: number
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
}
