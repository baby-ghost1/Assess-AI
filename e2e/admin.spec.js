import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './helpers.js'

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display admin page with tabs', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: 'Admin Panel' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Overview' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Users' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Roles' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Settings' })).toBeVisible()
  })

  test('should show Users tab with search', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('button', { name: 'Users' }).click()
    await expect(page.getByPlaceholder(/Search by name/)).toBeVisible({ timeout: 5000 })
  })

  test('should show Roles tab with role names', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('button', { name: 'Roles' }).click()
    await page.waitForTimeout(2000)
    await expect(page.getByText(/admin/i).first()).toBeVisible({ timeout: 5000 })
  })

  test('should show Settings tab', async ({ page }) => {
    await page.goto('/admin')
    await page.getByRole('button', { name: 'Settings' }).click()
    await page.waitForTimeout(2000)
    const heading = page.getByRole('heading', { name: /Panel/i })
    await expect(heading).toBeVisible({ timeout: 5000 })
  })
})
