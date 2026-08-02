import type { Page } from '@playwright/test'
import { API_URL } from '../api-url'
import type { MockState } from '../mock-api'
import { computeSummary, computeTopSources, computeTrends, filterLogEntries } from '../selectors'

function dashboardFilters(url: URL) {
  return {
    logFileId: url.searchParams.get('logFileId') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  }
}

export async function registerDashboardHandlers(page: Page, state: MockState): Promise<void> {
  await page.route(new RegExp(`^${API_URL}/dashboard/summary(\\?[^/]*)?$`), async (route) => {
    const url = new URL(route.request().url())
    const filtered = filterLogEntries(state.logEntries, dashboardFilters(url))
    await route.fulfill({ json: computeSummary(filtered) })
  })

  await page.route(new RegExp(`^${API_URL}/dashboard/trends(\\?[^/]*)?$`), async (route) => {
    const url = new URL(route.request().url())
    const filtered = filterLogEntries(state.logEntries, dashboardFilters(url))
    const bucket = (url.searchParams.get('bucket') as 'hour' | 'day' | null) ?? 'day'
    const splitByLevel = url.searchParams.get('splitByLevel') === 'true'
    await route.fulfill({ json: { bucket, series: computeTrends(filtered, bucket, splitByLevel) } })
  })

  await page.route(new RegExp(`^${API_URL}/dashboard/top-sources(\\?[^/]*)?$`), async (route) => {
    const url = new URL(route.request().url())
    const filtered = filterLogEntries(state.logEntries, dashboardFilters(url))
    const by = (url.searchParams.get('by') as 'volume' | 'errorRate' | null) ?? 'volume'
    const limit = Number.parseInt(url.searchParams.get('limit') ?? '8', 10)
    await route.fulfill({ json: computeTopSources(filtered, by, limit) })
  })
}
