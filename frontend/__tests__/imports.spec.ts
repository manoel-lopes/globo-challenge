import { expect, type Page, test } from '@playwright/test'
import { mockApi, type MockState } from './infra/mock-api'

function logFileRow(page: Page, filename: string) {
  return page.getByRole('row').filter({ hasText: filename })
}

test.describe('Imports Page', () => {
  let state: MockState

  test.beforeEach(async ({ page }) => {
    state = await mockApi(page)
  })

  test('displays seeded files with pagination', async ({ page }) => {
    await page.goto('/imports')

    await expect(page.getByText('Page 1 of 2 · 12 files')).toBeVisible()
    await expect(page.getByText('checkout-service.log')).toBeVisible()
    await expect(page.getByText('worker-service.log')).toBeVisible()
    const nextButton = page.getByRole('button', { name: 'Next page' })
    const previousButton = page.getByRole('button', { name: 'Previous page' })
    await expect(previousButton).toBeDisabled()
    await expect(nextButton).toBeEnabled()

    await nextButton.click()
    await expect(page.getByText('Page 2 of 2 · 12 files')).toBeVisible()
    await expect(page.getByText('gateway-service.log')).toBeVisible()
    await expect(nextButton).toBeDisabled()
    await expect(previousButton).toBeEnabled()
  })

  test('shows the FAILED status for the seeded failed import', async ({ page }) => {
    await page.goto('/imports')
    await expect(logFileRow(page, 'worker-service.log').getByText('FAILED')).toBeVisible()
  })

  test('uploads a valid log file and tracks it through to completion', async ({ page }) => {
    await page.goto('/imports')
    await expect(page.getByText('Page 1 of 2 · 12 files')).toBeVisible()

    await page.locator('input[type="file"]').setInputFiles({
      name: 'new-service.log',
      mimeType: 'text/plain',
      buffer: Buffer.from('2026-01-01T00:00:00.000Z INFO new-service: hello world\n'),
    })

    await expect(page.getByText('Upload started for new-service.log. Processing in background…')).toBeVisible()

    const row = logFileRow(page, 'new-service.log')
    await expect(row.getByText('PENDING')).toBeVisible()
    await expect(row.getByText('PROCESSING')).toBeVisible({ timeout: 5000 })
    await expect(row.getByText('COMPLETED')).toBeVisible({ timeout: 5000 })
  })

  test('marks an upload as failed when the filename signals a processing failure', async ({ page }) => {
    await page.goto('/imports')

    await page.locator('input[type="file"]').setInputFiles({
      name: 'broken-fail.log',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a valid log line'),
    })

    const row = logFileRow(page, 'broken-fail.log')
    await expect(row.getByText('PENDING')).toBeVisible()
    await expect(row.getByText('FAILED')).toBeVisible({ timeout: 5000 })
  })

  test('rejects unsupported file extensions without contacting the server', async ({ page }) => {
    await page.goto('/imports')
    await expect(page.getByText('Page 1 of 2 · 12 files')).toBeVisible()

    let uploadRequested = false
    page.on('request', (request) => {
      if (request.method() === 'POST' && request.url().includes('/log-files')) uploadRequested = true
    })

    await page.locator('input[type="file"]').setInputFiles({
      name: 'malware.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('binary'),
    })

    await expect(page.getByText('Unsupported file type. Use .log, .txt, .jsonl, .json.')).toBeVisible()
    await expect(page.getByText('Page 1 of 2 · 12 files')).toBeVisible()
    expect(uploadRequested).toBe(false)
  })

  test('links to the Logs page filtered by the selected file', async ({ page }) => {
    await page.goto('/imports')
    const checkout = state.logFiles.find((file) => file.filename === 'checkout-service.log')
    if (!checkout) throw new Error('Expected a seeded checkout-service.log file')

    await logFileRow(page, 'checkout-service.log').getByRole('link', { name: 'View logs' }).click()

    await expect(page).toHaveURL(new RegExp(`/logs\\?logFileId=${checkout.id}`))
    await expect(page.getByRole('combobox', { name: 'Log file' })).toContainText('checkout-service.log')
  })

  test('shows an empty state when there are no imports', async ({ page }) => {
    await page.route(/\/log-files(\?[^/]*)?$/, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }
      await route.fulfill({
        json: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1, items: [], order: 'desc' },
      })
    })

    await page.goto('/imports')
    await expect(page.getByText('No imports yet')).toBeVisible()
    await expect(page.getByText('Upload a log file to start analyzing entries.')).toBeVisible()
  })

  test('shows an error state when imports fail to load', async ({ page }) => {
    await page.route(/\/log-files(\?[^/]*)?$/, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fallback()
        return
      }
      await route.fulfill({
        status: 500,
        json: { statusCode: 500, message: 'Internal server error', error: 'Internal Server Error' },
      })
    })

    await page.goto('/imports')
    await expect(page.getByText('Failed to load imports')).toBeVisible()
    await expect(page.getByText('Internal server error')).toBeVisible()
  })
})
