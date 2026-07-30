import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import {
  getDashboardSummary,
  getDashboardTopSources,
  getDashboardTrends,
  listLogFiles,
  listLogs,
} from '@tests/helpers/domain/enterprise/logs/log-requests'

describe('Dashboard empty state (E2E)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await makeApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should return a zeroed summary before any import', async () => {
    const response = await getDashboardSummary(app)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      totalEntries: 0,
      countsByLevel: {
        TRACE: 0,
        DEBUG: 0,
        INFO: 0,
        WARN: 0,
        ERROR: 0,
        FATAL: 0,
        UNKNOWN: 0,
      },
      distinctSources: 0,
      filesProcessed: 0,
    })
  })

  it('should return an empty trend series before any import', async () => {
    const response = await getDashboardTrends(app)

    expect(response.statusCode).toBe(200)
    expect(response.body.bucket).toBe('hour')
    expect(response.body.series).toEqual([])
  })

  it('should return no top sources before any import', async () => {
    const response = await getDashboardTopSources(app)

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual([])
  })

  it('should return an empty log listing before any import', async () => {
    const response = await listLogs(app)

    expect(response.statusCode).toBe(200)
    expect(response.body.items).toEqual([])
    expect(response.body.nextCursor).toBeNull()
  })

  it('should return an empty log file listing before any import', async () => {
    const response = await listLogFiles(app)

    expect(response.statusCode).toBe(200)
    expect(response.body.items).toEqual([])
    expect(response.body.totalItems).toBe(0)
  })
})
