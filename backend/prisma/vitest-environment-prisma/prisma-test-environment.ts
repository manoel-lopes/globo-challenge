import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { config } from 'dotenv'
import Redis from 'ioredis'
import { Client } from 'pg'
import type { Environment } from 'vitest'

config({ path: '.env', override: true, quiet: true })
config({ path: '.env.test', override: true, quiet: true })

function getBaseDatabaseUrl (): string {
  const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl?.startsWith('postgresql://')) {
    const url = new URL(databaseUrl)
    url.searchParams.set('schema', 'public')
    return url.toString()
  }
  const dbUser = process.env.DB_USER
  const dbPassword = process.env.DB_PASSWORD
  const dbHost = process.env.DB_HOST ?? 'localhost'
  const dbPort = process.env.DB_PORT ?? '5432'
  const dbName = process.env.DB_NAME
  return `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}?schema=public`
}

function withDatabaseName (databaseUrl: string, databaseName: string): string {
  const url = new URL(databaseUrl)
  url.pathname = `/${databaseName}`
  url.searchParams.set('schema', 'public')
  return url.toString()
}

async function withMaintenanceClient<T> (
  maintenanceURL: string,
  run: (client: Client) => Promise<T>
): Promise<T> {
  const client = new Client({ connectionString: maintenanceURL })
  await client.connect()
  try {
    return await run(client)
  } finally {
    await client.end()
  }
}

async function flushRedis (): Promise<void> {
  const redis = new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT ?? 6379),
    db: Number(process.env.REDIS_DB ?? 0),
    lazyConnect: true,
  })
  try {
    await redis.connect()
    await redis.flushdb()
  } finally {
    redis.disconnect()
  }
}

export default <Environment>{
  name: 'prisma',
  viteEnvironment: 'ssr',
  async setup () {
    const databaseName = `e2e_${randomUUID().replaceAll('-', '')}`
    const baseDatabaseURL = getBaseDatabaseUrl()
    const databaseURL = withDatabaseName(baseDatabaseURL, databaseName)
    const maintenanceURL = withDatabaseName(baseDatabaseURL, 'postgres')

    await withMaintenanceClient(maintenanceURL, async (client) => {
      await client.query(`CREATE DATABASE "${databaseName}"`)
    })

    process.env.DATABASE_URL = databaseURL

    execSync('pnpm prisma migrate deploy', {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: databaseURL },
    })

    await flushRedis()

    return {
      async teardown () {
        await withMaintenanceClient(maintenanceURL, async (client) => {
          await client.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = $1 AND pid <> pg_backend_pid()
          `, [databaseName])
          await client.query(`DROP DATABASE IF EXISTS "${databaseName}"`)
        })
      },
    }
  },
}
