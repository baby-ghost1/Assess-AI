import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers.js'

test.describe('Analytics', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('should display user analytics page', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.getByRole('heading', { name: 'My Analytics' })).toBeVisible()
  })

  test('should show stat cards', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.getByText('Total Attempts')).toBeVisible()
    await expect(page.getByText('Pass Rate', { exact: true })).toBeVisible()
    await expect(page.getByText('Avg Score')).toBeVisible()
  })

  test('should show recent activity section', async ({ page }) => {
    await page.goto('/analytics')
    await expect(page.getByText('Recent Activity')).toBeVisible()
  })
})
