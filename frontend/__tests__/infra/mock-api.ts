import type { Page } from '@playwright/test'
import type { LogEntry } from '@/core/domain/entities/log-entry'
import type { LogFile } from '@/core/domain/entities/log-file'
import { registerDashboardHandlers } from './handlers/dashboard'
import { registerLogFileHandlers } from './handlers/log-files'
import { registerLogHandlers } from './handlers/logs'
import { buildSeedData } from './seed-data'

export interface MockState {
  logFiles: LogFile[]
  logEntries: LogEntry[]
}

export async function mockApi(page: Page): Promise<MockState> {
  const seed = buildSeedData()
  const state: MockState = {
    logFiles: [...seed.logFiles],
    logEntries: [...seed.logEntries],
  }

  await registerLogFileHandlers(page, state)
  await registerLogHandlers(page, state)
  await registerDashboardHandlers(page, state)

  return state
}
