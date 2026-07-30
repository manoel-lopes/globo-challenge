import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import {
  getDashboardSummary,
  listLogs,
  uploadLogFile,
} from '@tests/helpers/domain/enterprise/logs/log-requests'

type LogEntryResponse = {
  id: string
  level: string
  timestamp: string
  source: string | null
  message: string
  rawLine: string
}

const fixturesDir = join(process.cwd(), 'tests/fixtures')

function readFixture (filename: string): string {
  return readFileSync(join(fixturesDir, filename), 'utf8')
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

describe('LogClassification levels (E2E)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await makeApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should classify every severity level and its aliases', async () => {
    const upload = await uploadLogFile(app, 'all-levels.log', readFixture('all-levels.log'))

    expect(upload.statusCode).toBe(201)
    expect(upload.body.totalLines).toBe(10)
    expect(upload.body.failedLines).toBe(0)

    const summary = await getDashboardSummary(app, { logFileId: upload.body.id })

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

describe('LogClassification custom formats (E2E)', () => {
  let app: INestApplication
  let entries: LogEntryResponse[]

  beforeAll(async () => {
    app = await makeApp()
    entries = await importAndList(
      app,
      'custom-format.log',
      readFixture('custom-format.log')
    )
  })

  afterAll(async () => {
    await app.close()
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

describe('LogClassification timestamps (E2E)', () => {
  let app: INestApplication
  let entries: LogEntryResponse[]
  let importedAt: Date

  beforeAll(async () => {
    app = await makeApp()
    importedAt = new Date()
    entries = await importAndList(
      app,
      'mixed-timestamps.log',
      readFixture('mixed-timestamps.log')
    )
  })

  afterAll(async () => {
    await app.close()
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

describe('LogClassification determinism (E2E)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await makeApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should classify the same log lines identically across imports', async () => {
    const baseContent = [
      '[2025-05-05T07:00:00Z] INFO billing invoice generated',
      '[2025-05-05T07:00:01Z] WARN billing retry scheduled',
      '[2025-05-05T07:00:02Z] ERROR billing charge failed',
      '',
    ].join('\n')

    const first = await importAndList(app, 'determinism-a.log', baseContent)
    const second = await importAndList(
      app,
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
