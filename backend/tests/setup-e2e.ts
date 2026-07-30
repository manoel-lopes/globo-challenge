import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Logger } from '@nestjs/common'
import { config } from 'dotenv'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

Logger.overrideLogger(false)

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error && reason.message === 'Connection is closed.') {
    return
  }
  throw reason
})

function getBaseDatabaseUrl (): string {
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl?.startsWith('postgresql://')) {
    return databaseUrl
  }
  const dbUser = process.env.DB_USER
  const dbPassword = process.env.DB_PASSWORD
  const dbHost = process.env.DB_HOST ?? 'localhost'
  const dbPort = process.env.DB_PORT ?? '5432'
  const dbName = process.env.DB_NAME
  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`
}

function generateUniqueDatabaseURL (schemaId: string) {
  const baseDatabaseURL = getBaseDatabaseUrl()
  const url = new URL(baseDatabaseURL)
  url.searchParams.set('schema', schemaId)
  return url.toString()
}

function createPrismaClient (connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

let schemaId: string
let prisma: PrismaClient
beforeAll(async () => {
  schemaId = randomUUID()
  const baseDatabaseURL = getBaseDatabaseUrl()
  const databaseURL = generateUniqueDatabaseURL(schemaId)
  process.env.DATABASE_URL = databaseURL
  const tempPrisma = createPrismaClient(baseDatabaseURL.replace(/\?schema=.*$/, ''))
  await tempPrisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaId}"`)
  await tempPrisma.$disconnect()
  execSync(`DATABASE_URL="${databaseURL}" pnpm prisma migrate deploy`, { stdio: 'pipe' })
  prisma = createPrismaClient(databaseURL)
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})
