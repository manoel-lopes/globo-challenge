import { expect, type Page, test } from '@playwright/test'
import { resolvePresetRange } from '@/util/date-range'
import { formatNumber } from '@/util/format-number'
import { API_URL } from './infra/api-url'
import { mockApi, type MockState } from './infra/mock-api'
import { computeSummary, computeTopSources, filterLogEntries } from './infra/selectors'

function cardWithText(page: Page, text: string) {
  return page.locator('[data-slot="card"]').filter({ hasText: text })
}

test.describe('Dashboard Page', () => {
  let state: MockState

  test.beforeEach(async ({ page }) => {
    state = await mockApi(page)
  })

  test('loads as the default route', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page')
  })

  test('navigates to the Logs page via the sidebar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Logs' }).click()

    await expect(page).toHaveURL('/logs')
    await expect(page.getByRole('heading', { name: 'Logs', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Logs' })).toHaveAttribute('aria-current', 'page')
  })

  test('navigates to the Imports page via the sidebar', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'Imports' }).click()

    await expect(page).toHaveURL('/imports')
    await expect(page.getByRole('heading', { name: 'Imports', level: 1 })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Imports' })).toHaveAttribute('aria-current', 'page')
  })

  test('displays summary metrics for the default 7-day range', async ({ page }) => {
    await page.goto('/')

    const range = resolvePresetRange('7d')
    const expected = computeSummary(filterLogEntries(state.logEntries, range))
    const errors = (expected.countsByLevel.ERROR ?? 0) + (expected.countsByLevel.FATAL ?? 0)

    await expect(cardWithText(page, 'Total entries').getByText(formatNumber(expected.totalEntries))).toBeVisible()
    await expect(cardWithText(page, 'Errors & fatals').getByText(formatNumber(errors))).toBeVisible()
    await expect(
      cardWithText(page, 'Distinct sources').getByText(formatNumber(expected.distinctSources)),
    ).toBeVisible()
    await expect(
      cardWithText(page, 'Files processed').getByText(formatNumber(expected.filesProcessed)),
    ).toBeVisible()
  })

  test('narrows metrics to a single file when filtering by log file', async ({ page }) => {
    await page.goto('/')
    const payments = state.logFiles.find((file) => file.filename === 'payments-service.log')
    if (!payments) throw new Error('Expected a seeded payments-service.log file')

    await page.getByRole('combobox', { name: 'Log file' }).click()
    await page.getByRole('option', { name: 'payments-service.log' }).click()

    const range = resolvePresetRange('7d')
    const expected = computeSummary(
      filterLogEntries(state.logEntries, { ...range, logFileId: payments.id }),
    )

    await expect(cardWithText(page, 'Total entries').getByText(formatNumber(expected.totalEntries))).toBeVisible()
    await expect(
      cardWithText(page, 'Files processed').getByText(formatNumber(expected.filesProcessed)),
    ).toBeVisible()
  })

  test('increases totals as the date range widens', async ({ page }) => {
    await page.goto('/')

    for (const [label, presetId] of [
      ['Last 24 hours', '24h'],
      ['Last 7 days', '7d'],
      ['Last 30 days', '30d'],
      ['All time', 'all'],
    ] as const) {
      await test.step(`preset: ${label}`, async () => {
        await page.getByRole('combobox', { name: 'Time range' }).click()
        await page.getByRole('option', { name: label }).click()

        const expected = computeSummary(filterLogEntries(state.logEntries, resolvePresetRange(presetId)))
        await expect(
          cardWithText(page, 'Total entries').getByText(formatNumber(expected.totalEntries)),
        ).toBeVisible()
      })
    }
  })

  test('toggles the trends chart between Hourly and Daily buckets', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('tab', { name: 'Daily' })).toHaveAttribute('data-state', 'active')

    await page.getByRole('tab', { name: 'Hourly' }).click()
    await expect(page.getByRole('tab', { name: 'Hourly' })).toHaveAttribute('data-state', 'active')
    await expect(cardWithText(page, 'Event trends')).not.toContainText('No trend data')
  })

  test('toggles top sources between Volume and Error rate', async ({ page }) => {
    await page.goto('/')
    const range = resolvePresetRange('7d')
    const entries = filterLogEntries(state.logEntries, range)
    const topByVolume = computeTopSources(entries, 'volume', 8)[0]
    const topByErrorRate = computeTopSources(entries, 'errorRate', 8)[0]

    const topSources = cardWithText(page, 'Top sources')
    await expect(topSources).toContainText('Most active sources by volume')
    await expect(topSources.locator('li').first()).toContainText(topByVolume.source)

    await topSources.getByRole('tab', { name: 'Error rate' }).click()
    await expect(topSources).toContainText('Most active sources by error rate')
    await expect(topSources.locator('li').first()).toContainText(topByErrorRate.source)
  })

  test('shows empty states when the selected file has no entries', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('combobox', { name: 'Log file' }).click()
    await page.getByRole('option', { name: 'worker-service.log' }).click()

    await expect(cardWithText(page, 'Total entries').getByText('0')).toBeVisible()
    await expect(page.getByText('No trend data')).toBeVisible()
    await expect(page.getByText('No entries yet')).toBeVisible()
    await expect(page.getByText('No sources found')).toBeVisible()
  })

  test('keeps summary loading and shows empty charts when the API fails', async ({ page }) => {
    await page.route(new RegExp(`^${API_URL}/dashboard/(summary|trends|top-sources)(\\?[^/]*)?$`), async (route) => {
      await route.fulfill({
        status: 500,
        json: { statusCode: 500, message: 'Internal server error', error: 'Internal Server Error' },
      })
    })

    await page.goto('/')

    await expect(page.getByText('No trend data')).toBeVisible()
    await expect(page.getByText('No entries yet')).toBeVisible()
    await expect(page.getByText('No sources found')).toBeVisible()
    await expect(page.getByText('Total entries')).not.toBeVisible()
  })
})
