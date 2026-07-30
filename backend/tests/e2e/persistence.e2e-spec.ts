import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { INestApplication } from '@nestjs/common'
import { PrismaService } from '@/infra/persistence/prisma.service'
import { makeApp } from '@tests/helpers/app/make-app'
import { saltLogContent } from '@tests/helpers/domain/enterprise/logs/salt-log-content'
import {
  getLogFileById,
  listLogs,
  uploadLogFile,
} from '@tests/helpers/domain/enterprise/logs/log-requests'

const sampleLog = readFileSync(join(process.cwd(), 'tests/fixtures/sample.log'), 'utf8')

describe('Persistence across restarts (E2E)', () => {
  let app: INestApplication
  let logFileId: string

  beforeAll(async () => {
    app = await makeApp()
    const upload = await uploadLogFile(app, 'persisted.log', sampleLog)
    logFileId = upload.body.id
  })

  afterAll(async () => {
    await app.close()
  })

  it('should keep imported data available after the application restarts', async () => {
    const before = await listLogs(app, { logFileId, limit: 100 })
    expect(before.body.items).toHaveLength(5)

    await app.close()
    app = await makeApp()

    const file = await getLogFileById(app, logFileId)
    const after = await listLogs(app, { logFileId, limit: 100 })

    expect(file.statusCode).toBe(200)
    expect(file.body.status).toBe('COMPLETED')
    expect(after.body.items).toHaveLength(5)
    expect(after.body.items.map((item: { rawLine: string }) => item.rawLine).sort())
      .toEqual(before.body.items.map((item: { rawLine: string }) => item.rawLine).sort())
  })
})

describe('Storage indexes (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    app = await makeApp()
    prisma = app.get(PrismaService)
    await uploadLogFile(app, 'indexed.log', saltLogContent(sampleLog, 'indexed'))
  })

  afterAll(async () => {
    await app.close()
  })

  it.each([
    'log_entries_logFileId_idx',
    'log_entries_level_timestamp_idx',
    'log_entries_timestamp_idx',
    'log_entries_timestamp_id_idx',
    'log_entries_message_idx',
    'log_entries_rawLine_idx',
  ])('should have index %s available for query planning', async (indexName) => {
    const rows = await prisma.$queryRawUnsafe<{ indexname: string }[]>(
      `SELECT indexname FROM pg_indexes
       WHERE tablename = 'log_entries' AND indexname = $1`,
      indexName
    )

    expect(rows).toHaveLength(1)
  })

  it('should plan a level and timestamp filter using an index', async () => {
    const plan = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL enable_seqscan = off')
      return tx.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(
        `EXPLAIN SELECT id FROM log_entries
         WHERE level = 'ERROR'::"LogLevel" AND "timestamp" >= NOW() - INTERVAL '30 days'
         ORDER BY "timestamp" DESC LIMIT 50`
      )
    })

    const planText = plan.map((row) => row['QUERY PLAN']).join('\n')

    expect(planText).toMatch(/Index (Only )?Scan|Bitmap Index Scan/)
  })

  it('should plan a trigram text search using a GIN index', async () => {
    const plan = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe('SET LOCAL enable_seqscan = off')
      return tx.$queryRawUnsafe<{ 'QUERY PLAN': string }[]>(
        `EXPLAIN SELECT id FROM log_entries WHERE message ILIKE '%refused%'`
      )
    })

    const planText = plan.map((row) => row['QUERY PLAN']).join('\n')

    expect(planText).toContain('log_entries_message_idx')
  })
})
