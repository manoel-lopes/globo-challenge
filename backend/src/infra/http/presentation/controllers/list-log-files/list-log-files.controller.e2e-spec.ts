import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import {
  listLogFiles,
  uploadLogFile,
} from '@tests/helpers/domain/enterprise/logs/log-requests'

describe('ListLogFiles (E2E)', () => {
  let app: INestApplication
  const sampleLog = readFileSync(
    join(process.cwd(), 'tests/fixtures/sample.log'),
    'utf8'
  )

  beforeAll(async () => {
    app = await makeApp()
    await uploadLogFile(app, 'listed.log', sampleLog)
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list imported log files with pagination', async () => {
    const response = await listLogFiles(app, { page: 1, pageSize: 10 })

    expect(response.statusCode).toBe(200)
    expect(response.body.items.length).toBeGreaterThanOrEqual(1)
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        filename: expect.any(String),
        status: expect.any(String),
        id: expect.any(String),
      })
    )
    expect(response.body.page).toBe(1)
    expect(response.body.totalItems).toBeGreaterThanOrEqual(1)
  })

  it('should return 422 for invalid page', async () => {
    const response = await listLogFiles(app, { page: 0 })

    expect(response.statusCode).toBe(422)
  })
})
