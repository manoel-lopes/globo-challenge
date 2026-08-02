import { expect, test } from '@playwright/test'
import { mockApi, type MockState } from './infra/mock-api'

test.describe('Navigation', () => {
  let state: MockState

  test.beforeEach(async ({ page }) => {
    state = await mockApi(page)
  })

  test('loads the Dashboard as the default route', async ({ page }) => {
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

  test('navigates back to the Dashboard from another page', async ({ page }) => {
    await page.goto('/logs')
    await page.getByRole('link', { name: 'Dashboard' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible()
  })

  test('deep-links from Imports to Logs filtered by the selected file', async ({ page }) => {
    await page.goto('/imports')
    const checkout = state.logFiles.find((file) => file.filename === 'checkout-service.log')
    if (!checkout) throw new Error('Expected a seeded checkout-service.log file')

    await page
      .getByRole('row')
      .filter({ hasText: 'checkout-service.log' })
      .getByRole('link', { name: 'View logs' })
      .click()

    await expect(page).toHaveURL(new RegExp(`/logs\\?logFileId=${checkout.id}`))
    await expect(page.getByRole('heading', { name: 'Logs', level: 1 })).toBeVisible()
    await expect(page.getByRole('combobox', { name: 'Log file' })).toContainText('checkout-service.log')
  })
})
