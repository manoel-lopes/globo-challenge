import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import {
  listLogs,
  uploadLogFile,
} from '@tests/helpers/domain/enterprise/logs/log-requests'

describe('ListLogs (E2E)', () => {
  let app: INestApplication
  let logFileId: string
  const sampleLog = readFileSync(
    join(process.cwd(), 'tests/fixtures/sample.log'),
    'utf8'
  )

  beforeAll(async () => {
    app = await makeApp()
    const uploaded = await uploadLogFile(app, 'query.log', sampleLog)
    logFileId = uploaded.body.id
  })

  afterAll(async () => {
    await app.close()
  })

  it('should list logs with cursor pagination', async () => {
    const response = await listLogs(app, { logFileId, limit: 2 })

    expect(response.statusCode).toBe(200)
    expect(response.body.items).toHaveLength(2)
    expect(response.body.nextCursor).toBeDefined()
  })

  it('should follow cursor pagination to the next page', async () => {
    const firstPage = await listLogs(app, { logFileId, limit: 2 })
    const secondPage = await listLogs(app, {
      logFileId,
      limit: 2,
      cursor: firstPage.body.nextCursor,
    })

    expect(firstPage.statusCode).toBe(200)
    expect(secondPage.statusCode).toBe(200)
    expect(secondPage.body.items).toHaveLength(2)
    expect(secondPage.body.items[0].id).not.toBe(firstPage.body.items[0].id)
  })

  it('should use default cursor limit when limit is omitted', async () => {
    const response = await listLogs(app, { logFileId })

    expect(response.statusCode).toBe(200)
    expect(response.body.limit).toBe(50)
    expect(response.body.items.length).toBeGreaterThanOrEqual(5)
  })

  it('should filter logs by level and free-text search', async () => {
    const byLevel = await listLogs(app, { logFileId, level: 'ERROR' })
    const byText = await listLogs(app, { logFileId, q: 'Connection' })

    expect(byLevel.statusCode).toBe(200)
    expect(byLevel.body.items.every((item: { level: string }) => item.level === 'ERROR')).toBe(true)
    expect(byText.statusCode).toBe(200)
    expect(byText.body.items.length).toBeGreaterThanOrEqual(1)
  })

  it('should filter logs by comma-separated levels', async () => {
    const response = await listLogs(app, { logFileId, level: 'ERROR,WARN' })

    expect(response.statusCode).toBe(200)
    expect(response.body.items.length).toBeGreaterThanOrEqual(2)
    expect(
      response.body.items.every((item: { level: string }) =>
        ['ERROR', 'WARN'].includes(item.level)
      )
    ).toBe(true)
  })

  it('should filter logs by from/to date window', async () => {
    const response = await listLogs(app, {
      logFileId,
      from: '2024-01-01T10:00:00.000Z',
      to: '2024-01-01T10:00:01.000Z',
    })

    expect(response.statusCode).toBe(200)
    expect(response.body.items.length).toBeGreaterThanOrEqual(1)
    expect(response.body.items.length).toBeLessThanOrEqual(2)
  })

  it('should return empty items when free-text search has no match', async () => {
    const response = await listLogs(app, {
      logFileId,
      q: 'this-string-does-not-exist-anywhere',
    })

    expect(response.statusCode).toBe(200)
    expect(response.body.items).toEqual([])
  })

  it('should support offset pagination', async () => {
    const listed = await listLogs(app, { logFileId, page: 1, pageSize: 1 })

    expect(listed.statusCode).toBe(200)
    expect(listed.body.totalItems).toBe(5)
    expect(listed.body.items).toHaveLength(1)
    expect(listed.body.page).toBe(1)
    expect(listed.body.pageSize).toBe(1)
  })

  it('should return 422 when from is not an ISO datetime', async () => {
    const response = await listLogs(app, { from: 'not-a-date' })

    expect(response.statusCode).toBe(422)
  })

  it('should return 422 when to is not an ISO datetime', async () => {
    const response = await listLogs(app, { to: 'yesterday' })

    expect(response.statusCode).toBe(422)
  })

  it('should return 422 when logFileId is not a UUID', async () => {
    const response = await listLogs(app, { logFileId: 'bad-id' })

    expect(response.statusCode).toBe(422)
  })

  it('should return 422 when cursor is not a UUID', async () => {
    const response = await listLogs(app, { cursor: 'bad-cursor' })

    expect(response.statusCode).toBe(422)
  })

  it('should return 422 when limit is less than 1', async () => {
    const response = await listLogs(app, { limit: 0 })

    expect(response.statusCode).toBe(422)
  })

  it('should return 422 when limit exceeds max', async () => {
    const response = await listLogs(app, { limit: 101 })

    expect(response.statusCode).toBe(422)
  })

  it('should return 422 when page is less than 1', async () => {
    const response = await listLogs(app, { page: 0 })

    expect(response.statusCode).toBe(422)
  })

  it('should return 422 when order is invalid', async () => {
    const response = await listLogs(app, { order: 'bad' })

    expect(response.statusCode).toBe(422)
  })
})
