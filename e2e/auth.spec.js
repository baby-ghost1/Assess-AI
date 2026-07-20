import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers.js'

test.describe('Authentication', () => {
  test('should show error for invalid login', async ({ page }) => {
    await page.goto('/login')
    await page.getByPlaceholder('you@example.com').fill('wrong@email.com')
    await page.locator('input[name="password"]').fill('wrongpass')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.locator('.text-danger')).toBeVisible({ timeout: 15000 })
  })

  test('should login and see dashboard', async ({ page }) => {
    await loginAsTestUser(page)
    await expect(page.getByText(/Welcome back/)).toBeVisible({ timeout: 10000 })
  })

  test('should show and hide password', async ({ page }) => {
    await page.goto('/login')
    const passwordInput = page.locator('input[name="password"]')
    await expect(passwordInput).toHaveAttribute('type', 'password')
    await page.locator('button[type="button"]').filter({ has: page.locator('svg') }).click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
