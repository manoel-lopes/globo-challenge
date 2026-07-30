import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import {
  getLogById,
  listLogs,
  uploadLogFile,
} from '@tests/helpers/domain/enterprise/logs/log-requests'

describe('GetLogEntryById (E2E)', () => {
  let app: INestApplication
  let entryId: string
  const sampleLog = readFileSync(
    join(process.cwd(), 'tests/fixtures/sample.log'),
    'utf8'
  )

  beforeAll(async () => {
    app = await makeApp()
    const uploaded = await uploadLogFile(app, 'entry-by-id.log', sampleLog)
    const listed = await listLogs(app, { logFileId: uploaded.body.id, limit: 1 })
    entryId = listed.body.items[0].id
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return a log entry by id', async () => {
    const response = await getLogById(app, entryId)

    expect(response.statusCode).toBe(200)
    expect(response.body.id).toBe(entryId)
    expect(response.body.message).toBeDefined()
    expect(response.body.rawLine).toBeDefined()
  })

  it('should return 404 when log entry does not exist', async () => {
    const response = await getLogById(app, randomUUID())

    expect(response.statusCode).toBe(404)
    expect(response.body.message).toBe('LogEntry not found')
  })

  it('should return 422 when id is not a UUID', async () => {
    const response = await getLogById(app, 'not-a-uuid')

    expect(response.statusCode).toBe(422)
  })
})
