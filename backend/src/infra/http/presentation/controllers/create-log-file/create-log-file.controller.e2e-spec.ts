import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { makeApp } from '@tests/helpers/app/make-app'
import {
  getDashboardSummary,
  getLogFileById,
  listLogs,
  uploadLogFile,
} from '@tests/helpers/domain/enterprise/logs/log-requests'
import { saltLogContent } from '@tests/helpers/domain/enterprise/logs/salt-log-content'

const fixturesDir = join(process.cwd(), 'tests/fixtures')

function readFixture (filename: string): string {
  return readFileSync(join(fixturesDir, filename), 'utf8')
}

type LogEntryResponse = {
  id: string
  level: string
  timestamp: string
  source: string | null
  message: string
  rawLine: string
}

async function waitForCompletion (
  app: INestApplication,
  logFileId: string,
  timeoutMs: number
): Promise<Record<string, number | string>> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const response = await getLogFileById(app, logFileId)
    const status = response.body.status
    if (status === 'COMPLETED' || status === 'FAILED') {
      return response.body
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Log file ${logFileId} did not finish within ${timeoutMs}ms`)
}

async function importAndList (
  app: INestApplication,
  filename: string,
  content: string
): Promise<LogEntryResponse[]> {
  const upload = await uploadLogFile(app, filename, content)
  expect(upload.statusCode).toBe(201)
  expect(upload.body.status).toBe('COMPLETED')

  const logs = await listLogs(app, { logFileId: upload.body.id, limit: 100 })
  expect(logs.statusCode).toBe(200)

  return logs.body.items as LogEntryResponse[]
}

function findByMessage (entries: LogEntryResponse[], fragment: string): LogEntryResponse {
  const entry = entries.find((item) => item.rawLine.includes(fragment))
  if (!entry) throw new Error(`No entry matching "${fragment}"`)
  return entry
}

describe('CreateLogFileController (E2E)', () => {
  let app: INestApplication
  const sampleLog = readFileSync(join(fixturesDir, 'sample.log'), 'utf8')
  const sampleTxt = readFileSync(join(fixturesDir, 'sample.txt'), 'utf8')
  const sampleJsonl = readFileSync(join(fixturesDir, 'sample.jsonl'), 'utf8')

  beforeAll(async () => {
    app = await makeApp()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('basic upload', () => {
    it('should return 400 when no file is uploaded', async () => {
      const response = await request(app.getHttpServer()).post('/log-files')

      expect(response.statusCode).toBe(400)
      expect(response.body.message).toBe('Log file is required')
    })

    it('should return 415 for unsupported file types', async () => {
      const response = await uploadLogFile(app, 'notes.csv', 'a,b,c')

      expect(response.statusCode).toBe(415)
      expect(response.body.message).toContain('Unsupported file type')
    })

    it.each([
      { filename: 'sample.log', content: saltLogContent(sampleLog, 'log') },
      { filename: 'sample.txt', content: saltLogContent(sampleTxt, 'txt') },
      { filename: 'sample.jsonl', content: saltLogContent(sampleJsonl, 'jsonl') },
      { filename: 'sample.json', content: saltLogContent(sampleJsonl, 'json') },
    ])('should import $filename and return COMPLETED status', async ({ filename, content }) => {
      const response = await uploadLogFile(app, filename, content)

      expect(response.statusCode).toBe(201)
      expect(response.body.filename).toBe(filename)
      expect(response.body.status).toBe('COMPLETED')
      expect(response.body.totalLines).toBe(5)
      expect(response.body.processedLines).toBe(5)
      expect(response.body.failedLines).toBe(1)
      expect(response.body.id).toBeDefined()
    })
  })

  describe('size limit', () => {
    let limitedApp: INestApplication
    const limitedMaxUploadSize = 1024

    beforeAll(async () => {
      limitedApp = await makeApp({ maxUploadSize: limitedMaxUploadSize })
    })

    afterAll(async () => {
      await limitedApp.close()
    })

    it('should return 413 when file exceeds maximum allowed size', async () => {
      const oversized = Buffer.alloc(limitedMaxUploadSize + 1, 'a')

      const response = await uploadLogFile(limitedApp, 'huge.log', oversized)

      expect(response.statusCode).toBe(413)
      expect(response.body.message).toContain('File exceeds maximum allowed size')
    })
  })

  describe('async processing (inline driver)', () => {
    let asyncApp: INestApplication
    const sampleLog = saltLogContent(
      readFileSync(join(fixturesDir, 'sample.log'), 'utf8'),
      'async-pending'
    )

    beforeAll(async () => {
      asyncApp = await makeApp({ logSyncMaxBytes: 1 })
    })

    afterAll(async () => {
      await asyncApp.close()
    })

    it('should return PENDING for files above the sync threshold', async () => {
      const response = await uploadLogFile(asyncApp, 'async.log', sampleLog)

      expect(response.statusCode).toBe(201)
      expect(response.body.status).toBe('PENDING')
      expect(response.body.id).toBeDefined()
    })
  })

  describe('concurrent duplicate detection', () => {
    let dupApp: INestApplication
    const content = saltLogContent(
      readFileSync(join(fixturesDir, 'sample.log'), 'utf8'),
      'concurrent-dup'
    )

    beforeAll(async () => {
      dupApp = await makeApp()
    })

    afterAll(async () => {
      await dupApp.close()
    })

    it('should return 409 for one of two concurrent identical uploads', async () => {
      const [a, b] = await Promise.all([
        uploadLogFile(dupApp, 'race-a.log', content),
        uploadLogFile(dupApp, 'race-b.log', content),
      ])

      const statuses = [a.statusCode, b.statusCode].sort()
      expect(statuses).toEqual([201, 409])

      const conflict = a.statusCode === 409 ? a : b
      const created = a.statusCode === 201 ? a : b
      expect(conflict.body.message).toContain(created.body.id)
    })
  })

  describe('BullMQ queue processing', () => {
    let bullmqApp: INestApplication
    const sampleLog = saltLogContent(
      readFileSync(join(fixturesDir, 'sample.log'), 'utf8'),
      'bullmq-queue'
    )

    beforeAll(async () => {
      bullmqApp = await makeApp({
        logSyncMaxBytes: 1,
        logQueueDriver: 'bullmq',
      })
    })

    afterAll(async () => {
      await bullmqApp.close()
    })

    it('should enqueue large files via BullMQ and complete asynchronously', async () => {
      const response = await uploadLogFile(bullmqApp, 'bullmq.log', sampleLog)

      expect(response.statusCode).toBe(201)
      expect(response.body.status).toBe('PENDING')
      expect(response.body.id).toBeDefined()

      const settled = await waitForCompletion(bullmqApp, response.body.id, 15_000)

      expect(settled.status).toBe('COMPLETED')
      expect(settled.totalLines).toBe(5)
      expect(settled.processedLines).toBe(5)
      expect(settled.failedLines).toBe(1)
    })
  })

  describe('log classification - severity levels', () => {
    let classifyApp: INestApplication

    beforeAll(async () => {
      classifyApp = await makeApp()
    })

    afterAll(async () => {
      await classifyApp.close()
    })

    it('should classify every severity level and its aliases', async () => {
      const upload = await uploadLogFile(classifyApp, 'all-levels.log', readFixture('all-levels.log'))

      expect(upload.statusCode).toBe(201)
      expect(upload.body.totalLines).toBe(10)
      expect(upload.body.failedLines).toBe(0)

      const summary = await getDashboardSummary(classifyApp, { logFileId: upload.body.id })

      expect(summary.statusCode).toBe(200)
      expect(summary.body.countsByLevel).toEqual({
        TRACE: 1,
        DEBUG: 1,
        INFO: 2,
        WARN: 2,
        ERROR: 2,
        FATAL: 2,
        UNKNOWN: 0,
      })
    })
  })

  describe('log classification - custom formats', () => {
    let classifyApp: INestApplication
    let entries: LogEntryResponse[]

    beforeAll(async () => {
      classifyApp = await makeApp()
      entries = await importAndList(
        classifyApp,
        'custom-format.log',
        readFixture('custom-format.log')
      )
    })

    afterAll(async () => {
      await classifyApp.close()
    })

    it('should fall back to keyword heuristics for non-standard formats', async () => {
      expect(entries).toHaveLength(5)
      expect(findByMessage(entries, 'charge declined').level).toBe('ERROR')
      expect(findByMessage(entries, 'cart abandoned').level).toBe('WARN')
      expect(findByMessage(entries, 'query executed').level).toBe('INFO')
      expect(findByMessage(entries, 'hit_ratio').level).toBe('DEBUG')
      expect(findByMessage(entries, 'total meltdown').level).toBe('FATAL')
    })

    it('should preserve the raw line for every classified entry', async () => {
      for (const entry of entries) {
        expect(entry.rawLine).toBeTruthy()
      }
    })
  })

  describe('log classification - timestamps', () => {
    let classifyApp: INestApplication
    let entries: LogEntryResponse[]
    let importedAt: Date

    beforeAll(async () => {
      classifyApp = await makeApp()
      importedAt = new Date()
      entries = await importAndList(
        classifyApp,
        'mixed-timestamps.log',
        readFixture('mixed-timestamps.log')
      )
    })

    afterAll(async () => {
      await classifyApp.close()
    })

    it('should normalize an offset-aware timestamp to UTC', async () => {
      const entry = findByMessage(entries, 'offset aware timestamp')

      expect(entry.timestamp).toBe('2024-03-15T11:30:00.000Z')
    })

    it('should parse epoch millis and ISO timestamps to the same instant', async () => {
      const epoch = findByMessage(entries, 'epoch millis timestamp')
      const iso = findByMessage(entries, 'iso zulu timestamp')

      expect(epoch.timestamp).toBe('2024-03-15T08:30:00.000Z')
      expect(iso.timestamp).toBe(epoch.timestamp)
    })

    it('should infer a sensible year for year-less syslog timestamps', async () => {
      const entry = findByMessage(entries, 'failed password')
      const timestamp = new Date(entry.timestamp)

      expect(timestamp.getUTCMonth()).toBe(2)
      expect(timestamp.getUTCDate()).toBe(15)
      expect(timestamp.getUTCFullYear()).toBeGreaterThanOrEqual(
        importedAt.getUTCFullYear() - 1
      )
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('should fall back to import time when the timestamp is unparseable', async () => {
      const entry = findByMessage(entries, 'unparseable timestamp')
      const timestamp = new Date(entry.timestamp)

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(importedAt.getTime() - 1000)
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now() + 1000)
    })

    it('should fall back to import time when no timestamp is present', async () => {
      const entry = findByMessage(entries, 'no timestamp at all here')
      const timestamp = new Date(entry.timestamp)

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(importedAt.getTime() - 1000)
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now() + 1000)
    })
  })

  describe('log classification - determinism', () => {
    let classifyApp: INestApplication

    beforeAll(async () => {
      classifyApp = await makeApp()
    })

    afterAll(async () => {
      await classifyApp.close()
    })

    it('should classify the same log lines identically across imports', async () => {
      const baseContent = [
        '[2025-05-05T07:00:00Z] INFO billing invoice generated',
        '[2025-05-05T07:00:01Z] WARN billing retry scheduled',
        '[2025-05-05T07:00:02Z] ERROR billing charge failed',
        '',
      ].join('\n')

      const first = await importAndList(classifyApp, 'determinism-a.log', baseContent)
      const second = await importAndList(
        classifyApp,
        'determinism-b.log',
        `${baseContent}[2025-05-05T07:00:03Z] DEBUG billing unique suffix\n`
      )

      const shared = second.filter((entry) => entry.message !== 'unique suffix')
      const fingerprint = (items: LogEntryResponse[]) =>
        items
          .map((item) => `${item.level}|${item.timestamp}|${item.source}|${item.message}`)
          .sort()

      expect(fingerprint(shared)).toEqual(fingerprint(first))
    })
  })
})