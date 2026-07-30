import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { makeApp } from '@tests/helpers/app/make-app'
import { saltLogContent } from '@tests/helpers/domain/enterprise/logs/salt-log-content'
import { uploadLogFile } from '@tests/helpers/domain/enterprise/logs/log-requests'

describe('CreateLogFile (E2E)', () => {
  let app: INestApplication
  const fixturesDir = join(process.cwd(), 'tests/fixtures')
  const sampleLog = readFileSync(join(fixturesDir, 'sample.log'), 'utf8')
  const sampleTxt = readFileSync(join(fixturesDir, 'sample.txt'), 'utf8')
  const sampleJsonl = readFileSync(join(fixturesDir, 'sample.jsonl'), 'utf8')

  beforeAll(async () => {
    app = await makeApp()
  })

  afterAll(async () => {
    await app.close()
  })

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

describe('CreateLogFile size limit (E2E)', () => {
  let app: INestApplication
  const limitedMaxUploadSize = 1024

  beforeAll(async () => {
    app = await makeApp({ maxUploadSize: limitedMaxUploadSize })
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return 413 when file exceeds maximum allowed size', async () => {
    const oversized = Buffer.alloc(limitedMaxUploadSize + 1, 'a')

    const response = await uploadLogFile(app, 'huge.log', oversized)

    expect(response.statusCode).toBe(413)
    expect(response.body.message).toContain('File exceeds maximum allowed size')
  })
})

describe('CreateLogFile async processing (E2E)', () => {
  let app: INestApplication
  const sampleLog = saltLogContent(
    readFileSync(join(process.cwd(), 'tests/fixtures/sample.log'), 'utf8'),
    'async-pending'
  )

  beforeAll(async () => {
    app = await makeApp({ logSyncMaxBytes: 1 })
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return PENDING for files above the sync threshold', async () => {
    const response = await uploadLogFile(app, 'async.log', sampleLog)

    expect(response.statusCode).toBe(201)
    expect(response.body.status).toBe('PENDING')
    expect(response.body.id).toBeDefined()
  })
})
