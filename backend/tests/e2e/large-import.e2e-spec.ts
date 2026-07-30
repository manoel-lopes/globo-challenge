import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { makeApp } from '@tests/helpers/app/make-app'
import { getLogFileById, listLogs } from '@tests/helpers/domain/enterprise/logs/log-requests'

const LINE_COUNT = Number(process.env.E2E_LARGE_IMPORT_LINES ?? 100_000)
const IMPORT_BUDGET_MS = Number(process.env.E2E_LARGE_IMPORT_BUDGET_MS ?? 180_000)
const QUERY_BUDGET_MS = 2_000
const LEVELS = ['INFO', 'WARN', 'ERROR', 'DEBUG'] as const
const TEST_TIMEOUT_MS = IMPORT_BUDGET_MS + 60_000

function buildLogContent (lines: number): string {
  const start = Date.parse('2024-06-01T00:00:00.000Z')
  const chunks: string[] = []
  for (let index = 0; index < lines; index++) {
    const level = LEVELS[index % LEVELS.length]
    const timestamp = new Date(start + index * 1000).toISOString()
    chunks.push(`[${timestamp}] ${level} service-${index % 10} request ${index} completed`)
  }
  return `${chunks.join('\n')}\n`
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
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Log file ${logFileId} did not finish within ${timeoutMs}ms`)
}

describe('Large log import (E2E)', () => {
  let app: INestApplication
  let workDir: string
  let filePath: string
  let logFileId: string

  beforeAll(async () => {
    app = await makeApp()
    workDir = await mkdtemp(join(tmpdir(), 'large-import-'))
    filePath = join(workDir, 'large.log')
    await writeFile(filePath, buildLogContent(LINE_COUNT), 'utf8')
  }, TEST_TIMEOUT_MS)

  afterAll(async () => {
    await app.close()
    await rm(workDir, { recursive: true, force: true })
  })

  it('should accept a large upload without blocking the request', async () => {
    const response = await request(app.getHttpServer())
      .post('/log-files')
      .attach('file', filePath)

    expect(response.statusCode).toBe(201)
    expect(response.body.status).toBe('PENDING')

    logFileId = response.body.id
  }, TEST_TIMEOUT_MS)

  it('should finish processing every line within the time budget', async () => {
    const startedAt = Date.now()

    const logFile = await waitForCompletion(app, logFileId, IMPORT_BUDGET_MS)
    const elapsedMs = Date.now() - startedAt

    expect(logFile.status).toBe('COMPLETED')
    expect(logFile.totalLines).toBe(LINE_COUNT)
    expect(logFile.processedLines).toBe(LINE_COUNT)
    expect(logFile.failedLines).toBe(0)
    expect(elapsedMs).toBeLessThan(IMPORT_BUDGET_MS)
  }, TEST_TIMEOUT_MS)

  it('should answer a filtered paginated query over the large dataset quickly', async () => {
    const startedAt = Date.now()

    const response = await listLogs(app, {
      logFileId,
      level: 'ERROR',
      q: 'completed',
      limit: 50,
    })
    const elapsedMs = Date.now() - startedAt

    expect(response.statusCode).toBe(200)
    expect(response.body.items).toHaveLength(50)
    expect(
      response.body.items.every((item: { level: string }) => item.level === 'ERROR')
    ).toBe(true)
    expect(elapsedMs).toBeLessThan(QUERY_BUDGET_MS)
  }, TEST_TIMEOUT_MS)

  it('should keep offset pagination totals consistent with the import', async () => {
    const response = await listLogs(app, { logFileId, page: 1, pageSize: 10 })

    expect(response.statusCode).toBe(200)
    expect(response.body.totalItems).toBe(LINE_COUNT)
    expect(response.body.items).toHaveLength(10)
  }, TEST_TIMEOUT_MS)
})
