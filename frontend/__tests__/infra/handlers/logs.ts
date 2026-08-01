import type { Page } from '@playwright/test'
import type { LogLevel } from '@/core/domain/entities/log-entry'
import type { MockState } from '../mock-api'
import { filterLogEntries, paginateCursor, sortByTimestamp } from '../selectors'

export async function registerLogHandlers(page: Page, state: MockState): Promise<void> {
  await page.route(/\/logs(\?[^/]*)?$/, async (route) => {
    const request = route.request()
    if (request.method() !== 'GET') {
      await route.fallback()
      return
    }

    const url = new URL(request.url())
    const level = url.searchParams.get('level')
    const filtered = filterLogEntries(state.logEntries, {
      logFileId: url.searchParams.get('logFileId') ?? undefined,
      level: level ? (level.split(',') as LogLevel[]) : undefined,
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
    })
    const order = (url.searchParams.get('order') as 'asc' | 'desc' | null) ?? 'desc'
    const sorted = sortByTimestamp(filtered, order)
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '100', 10)
    const cursor = url.searchParams.get('cursor') ?? undefined
    await route.fulfill({ json: paginateCursor(sorted, cursor, limit) })
  })

  await page.route(/\/logs\/[^/?]+(\?[^/]*)?$/, async (route) => {
    const request = route.request()
    if (request.method() !== 'GET') {
      await route.fallback()
      return
    }
    const id = new URL(request.url()).pathname.split('/').pop()
    const entry = state.logEntries.find((item) => item.id === id)
    if (!entry) {
      await route.fulfill({
        status: 404,
        json: { statusCode: 404, message: 'Log entry not found.', error: 'Not Found' },
      })
      return
    }
    await route.fulfill({ json: entry })
  })
}
