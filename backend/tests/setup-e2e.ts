import { Logger } from '@nestjs/common'
import { config } from 'dotenv'

Logger.overrideLogger(false)

const isolatedDatabaseURL = process.env.DATABASE_URL

config({ path: '.env', override: true, quiet: true })
config({ path: '.env.test', override: true, quiet: true })

if (isolatedDatabaseURL?.startsWith('postgresql://')) {
  process.env.DATABASE_URL = isolatedDatabaseURL
}

process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error && reason.message === 'Connection is closed.') {
    return
  }
  throw reason
})
