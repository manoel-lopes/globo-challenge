import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import {
  getLogFileById,
  uploadLogFile,
} from '@tests/helpers/domain/enterprise/logs/log-requests'

describe('GetLogFileById (E2E)', () => {
  let app: INestApplication
  let logFileId: string
  const sampleLog = readFileSync(
    join(process.cwd(), 'tests/fixtures/sample.log'),
    'utf8'
  )

  beforeAll(async () => {
    app = await makeApp()
    const uploaded = await uploadLogFile(app, 'by-id.log', sampleLog)
    logFileId = uploaded.body.id
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return a log file by id', async () => {
    const response = await getLogFileById(app, logFileId)

    expect(response.statusCode).toBe(200)
    expect(response.body.id).toBe(logFileId)
    expect(response.body.filename).toBe('by-id.log')
    expect(response.body.status).toBe('COMPLETED')
    expect(response.body.totalLines).toBe(5)
  })

  it('should return 404 when log file does not exist', async () => {
    const response = await getLogFileById(app, randomUUID())

    expect(response.statusCode).toBe(404)
    expect(response.body.message).toBe('LogFile not found')
  })

  it('should return 422 when id is not a UUID', async () => {
    const response = await getLogFileById(app, 'not-a-uuid')

    expect(response.statusCode).toBe(422)
  })
})
