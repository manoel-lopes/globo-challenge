import { expect, test } from '@playwright/test'
import { resolvePresetRange } from '@/util/date-range'
import { mockApi, type MockState } from './infra/mock-api'
import { filterLogEntries } from './infra/selectors'

test.describe('Logs Page', () => {
  let state: MockState

  test.beforeEach(async ({ page }) => {
    state = await mockApi(page)
  })

  test('displays the first page of all seeded entries by default', async ({ page }) => {
    await page.goto('/logs')
    await expect(page.locator('tbody tr')).toHaveCount(100)
    await expect(page.getByText('Scroll for more')).toBeVisible()
  })

  test('loads more entries via infinite scroll until the end is reached', async ({ page }) => {
    await page.goto('/logs')
    await expect(page.locator('tbody tr')).toHaveCount(100)

    await page.getByText('Scroll for more').scrollIntoViewIfNeeded()
    await expect(page.locator('tbody tr')).toHaveCount(state.logEntries.length)
    await expect(page.getByText('End of results')).toBeVisible()
  })

  test('filters entries by severity level', async ({ page }) => {
    await page.goto('/logs')
    await expect(page.locator('tbody tr')).toHaveCount(100)

    await page.getByRole('button', { name: 'All levels' }).click()
    await page.getByRole('menuitemcheckbox', { name: 'FATAL' }).click()
    await page.keyboard.press('Escape')

    const expectedCount = filterLogEntries(state.logEntries, { level: ['FATAL'] }).length
    await expect(page.locator('tbody tr')).toHaveCount(expectedCount)
    await expect(page.getByRole('button', { name: 'FATAL' })).toBeVisible()
  })

  test('filters entries by log file', async ({ page }) => {
    await page.goto('/logs')
    const payments = state.logFiles.find((file) => file.filename === 'payments-service.log')
    if (!payments) throw new Error('Expected a seeded payments-service.log file')

    await page.getByRole('combobox', { name: 'Log file' }).click()
    await page.getByRole('option', { name: 'payments-service.log' }).click()

    const expectedCount = filterLogEntries(state.logEntries, { logFileId: payments.id }).length
    await expect(page.locator('tbody tr')).toHaveCount(expectedCount)
  })

  test('narrows results further by combining log file and date range filters', async ({ page }) => {
    await page.goto('/logs')
    const payments = state.logFiles.find((file) => file.filename === 'payments-service.log')
    if (!payments) throw new Error('Expected a seeded payments-service.log file')

    await page.getByRole('combobox', { name: 'Log file' }).click()
    await page.getByRole('option', { name: 'payments-service.log' }).click()

    await page.getByRole('combobox', { name: 'Time range' }).click()
    await page.getByRole('option', { name: 'Last 24 hours' }).click()

    const expectedCount = filterLogEntries(state.logEntries, {
      logFileId: payments.id,
      ...resolvePresetRange('24h'),
    }).length
    await expect(page.locator('tbody tr')).toHaveCount(expectedCount)
  })

  test('searches entries by message text', async ({ page }) => {
    await page.goto('/logs')
    await page.getByLabel('Search logs').fill('failed to capture payment')

    const expectedCount = filterLogEntries(state.logEntries, { q: 'failed to capture payment' }).length
    await expect(page.locator('tbody tr')).toHaveCount(expectedCount, { timeout: 5000 })
  })

  test('shows an empty state when a search has no matches', async ({ page }) => {
    await page.goto('/logs')
    await page.getByLabel('Search logs').fill('no-such-log-entry-exists')

    await expect(page.getByText('No log entries found')).toBeVisible()
  })

  test('opens the detail dialog with the full entry and closes it with Escape', async ({ page }) => {
    await page.goto('/logs')
    await page.getByRole('button', { name: 'All levels' }).click()
    await page.getByRole('menuitemcheckbox', { name: 'FATAL' }).click()
    await page.keyboard.press('Escape')
    await expect(page.locator('tbody tr')).toHaveCount(1)

    await page.locator('tbody tr').first().click()

    const dialog = page.getByRole('dialog', { name: 'Log entry' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('FATAL', { exact: true })).toBeVisible()
    await expect(dialog.getByText('checkout-api', { exact: true })).toBeVisible()
    await expect(dialog.getByText(/handled checkout request #1129/)).toBeVisible()
    await expect(dialog.getByText(/"orderId": "ORD-1129"/)).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('shows an error state when logs fail to load', async ({ page }) => {
    await page.route(/\/logs(\?[^/]*)?$/, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }
      await route.fulfill({
        status: 500,
        json: { statusCode: 500, message: 'Internal server error', error: 'Internal Server Error' },
      })
    })

    await page.goto('/logs')
    await expect(page.getByText('Failed to load logs')).toBeVisible()
    await expect(page.getByText('Internal server error')).toBeVisible()
  })
})
