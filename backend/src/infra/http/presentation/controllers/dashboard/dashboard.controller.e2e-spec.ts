import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import { makeApp } from '@tests/helpers/app/make-app'
import {
  getDashboardSummary,
  getDashboardTopSources,
  getDashboardTrends,
  listLogFiles,
  listLogs,
  uploadLogFile,
} from '@tests/helpers/domain/enterprise/logs/log-requests'

const fixturesDir = join(process.cwd(), 'tests/fixtures')

describe('DashboardController (E2E)', () => {
  let app: INestApplication

  beforeAll(async () => {
    app = await makeApp()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('empty state', () => {
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

  describe('with imported data', () => {
    let logFileId: string
    const sampleLog = readFileSync(
      join(fixturesDir, 'sample.log'),
      'utf8'
    )

    beforeAll(async () => {
      const uploaded = await uploadLogFile(app, 'dashboard.log', sampleLog)
      logFileId = uploaded.body.id
    })

    describe('summary endpoint', () => {
      it('should return dashboard summary', async () => {
        const response = await getDashboardSummary(app, { logFileId })

        expect(response.statusCode).toBe(200)
        expect(response.body.totalEntries).toBe(5)
        expect(response.body.countsByLevel.ERROR).toBeGreaterThanOrEqual(1)
        expect(response.body.distinctSources).toBeGreaterThanOrEqual(1)
      })

      it('should return zeroed summary for unknown logFileId', async () => {
        const response = await getDashboardSummary(app, {
          logFileId: '00000000-0000-4000-8000-000000000099',
        })

        expect(response.statusCode).toBe(200)
        expect(response.body.totalEntries).toBe(0)
        expect(response.body.distinctSources).toBe(0)
      })

      it('should return 422 when summary from is invalid', async () => {
        const response = await getDashboardSummary(app, { from: 'not-a-date' })

        expect(response.statusCode).toBe(422)
      })

      it('should return 422 when summary to is invalid', async () => {
        const response = await getDashboardSummary(app, { to: 'yesterday' })

        expect(response.statusCode).toBe(422)
      })

      it('should return 422 when summary logFileId is not a UUID', async () => {
        const response = await getDashboardSummary(app, { logFileId: 'bad-id' })

        expect(response.statusCode).toBe(422)
      })
    })

    describe('trends endpoint', () => {
      it('should return dashboard trends', async () => {
        const response = await getDashboardTrends(app, {
          bucket: 'hour',
          logFileId,
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-01-02T00:00:00.000Z',
        })

        expect(response.statusCode).toBe(200)
        expect(response.body.bucket).toBe('hour')
        expect(Array.isArray(response.body.series)).toBe(true)
        expect(response.body.series.length).toBeGreaterThanOrEqual(1)
      })

      it('should default trends bucket to hour', async () => {
        const response = await getDashboardTrends(app, {
          logFileId,
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-01-02T00:00:00.000Z',
        })

        expect(response.statusCode).toBe(200)
        expect(response.body.bucket).toBe('hour')
      })

      it('should return trends split by level when requested', async () => {
        const response = await getDashboardTrends(app, {
          bucket: 'hour',
          logFileId,
          from: '2024-01-01T00:00:00.000Z',
          to: '2024-01-02T00:00:00.000Z',
          splitByLevel: 'true',
        })

        expect(response.statusCode).toBe(200)
        expect(response.body.series.length).toBeGreaterThanOrEqual(1)
        expect(response.body.series[0].countsByLevel).toBeDefined()
      })

      it('should return 422 when trends bucket is invalid', async () => {
        const response = await getDashboardTrends(app, { bucket: 'minute' })

        expect(response.statusCode).toBe(422)
      })

      it('should return 422 when trends from is invalid', async () => {
        const response = await getDashboardTrends(app, { from: 'not-a-date' })

        expect(response.statusCode).toBe(422)
      })
    })

    describe('top-sources endpoint', () => {
      it('should return top sources', async () => {
        const response = await getDashboardTopSources(app, {
          logFileId,
          by: 'volume',
          limit: 5,
        })

        expect(response.statusCode).toBe(200)
        expect(Array.isArray(response.body)).toBe(true)
        expect(response.body[0]?.source).toBeDefined()
        expect(response.body[0]?.total).toBeGreaterThan(0)
      })

      it('should return top sources ranked by errorRate', async () => {
        const response = await getDashboardTopSources(app, {
          logFileId,
          by: 'errorRate',
          limit: 5,
        })

        expect(response.statusCode).toBe(200)
        expect(Array.isArray(response.body)).toBe(true)
        expect(response.body.length).toBeGreaterThanOrEqual(1)
        expect(response.body[0]).toEqual(
          expect.objectContaining({
            source: expect.any(String),
            total: expect.any(Number),
            errorCount: expect.any(Number),
            errorRate: expect.any(Number),
          })
        )
      })

      it('should default top sources limit to 10', async () => {
        const response = await getDashboardTopSources(app, { logFileId })

        expect(response.statusCode).toBe(200)
        expect(Array.isArray(response.body)).toBe(true)
        expect(response.body.length).toBeLessThanOrEqual(10)
      })

      it('should return 422 when top sources by is invalid', async () => {
        const response = await getDashboardTopSources(app, { by: 'invalid' })

        expect(response.statusCode).toBe(422)
      })

      it('should return 422 when top sources limit is less than 1', async () => {
        const response = await getDashboardTopSources(app, { limit: 0 })

        expect(response.statusCode).toBe(422)
      })

      it('should return 422 when top sources limit exceeds max', async () => {
        const response = await getDashboardTopSources(app, { limit: 101 })

        expect(response.statusCode).toBe(422)
      })
    })
  })
})