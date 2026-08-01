import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import { getLogFileById, uploadLogFile } from '@tests/helpers/domain/enterprise/logs/log-requests'
import { saltLogContent } from '@tests/helpers/domain/enterprise/logs/salt-log-content'

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

describe('CreateLogFile BullMQ queue (E2E)', () => {
  let app: INestApplication
  const sampleLog = saltLogContent(
    readFileSync(join(process.cwd(), 'tests/fixtures/sample.log'), 'utf8'),
    'bullmq-queue'
  )

  beforeAll(async () => {
    app = await makeApp({
      logSyncMaxBytes: 1,
      logQueueDriver: 'bullmq',
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('should enqueue large files via BullMQ and complete asynchronously', async () => {
    const response = await uploadLogFile(app, 'bullmq.log', sampleLog)

    expect(response.statusCode).toBe(201)
    expect(response.body.status).toBe('PENDING')
    expect(response.body.id).toBeDefined()

    const settled = await waitForCompletion(app, response.body.id, 15_000)

    expect(settled.status).toBe('COMPLETED')
    expect(settled.totalLines).toBe(5)
    expect(settled.processedLines).toBe(5)
    expect(settled.failedLines).toBe(1)
  })
})
