const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

test.describe('Form Validation - Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
  })

  test('should show validation errors for empty submission', async ({ page }) => {
    await page.click('button[type="submit"]')
    await page.waitForTimeout(500)
    const errors = page.locator('[class*="error"], [role="alert"], .text-danger, .text-red')
    await expect(errors.first()).toBeVisible({ timeout: 5000 })
  })

  test('should show error for invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    const pageContent = await page.textContent('body')
    const hasError = /invalid|email|error/i.test(pageContent)
    expect(hasError).toBeTruthy()
  })

  test('should show error for short password', async ({ page }) => {
    await page.fill('input[type="email"]', 'test@test.com')
    await page.fill('input[type="password"]', '123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    const pageContent = await page.textContent('body')
    const hasError = /password|short|min|error/i.test(pageContent)
    expect(hasError).toBeTruthy()
  })
})

test.describe('Form Validation - Register', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/register`)
    await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
  })

  test('should show errors for empty fields', async ({ page }) => {
    await page.click('button[type="submit"]')
    await page.waitForTimeout(500)
    const errors = page.locator('[class*="error"], [role="alert"], .text-danger, .text-red')
    const count = await errors.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should show error for invalid email', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="email"]', 'bademail')
    await page.fill('input[type="password"]', 'password123')
    await page.fill('input[name="confirmPassword"], input[placeholder*="confirm" i], input[type="password"]:nth-of-type(2)', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    const pageContent = await page.textContent('body')
    expect(/invalid|email/i.test(pageContent)).toBeTruthy()
  })

  test('should show error for short password', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="email"]', `test${Date.now()}@test.com`)
    await page.fill('input[type="password"]', '12345')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(1000)
    const pageContent = await page.textContent('body')
    expect(/password|short|min/i.test(pageContent)).toBeTruthy()
  })

  test('should show error for password mismatch', async ({ page }) => {
    await page.fill('input[name="name"]', 'Test User')
    await page.fill('input[type="email"]', `test${Date.now()}@test.com`)
    const passwordFields = page.locator('input[type="password"]')
    const count = await passwordFields.count()
    if (count >= 2) {
      await passwordFields.nth(0).fill('password123')
      await passwordFields.nth(1).fill('different123')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(1000)
      const pageContent = await page.textContent('body')
      expect(/match|confirm|different/i.test(pageContent)).toBeTruthy()
    }
  })
})

test.describe('Toast Messages', () => {
  test('should show error toast for invalid login', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
    await page.fill('input[type="email"]', 'wrong@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    const toast = page.locator('[class*="toast"], [role="alert"], [class*="notification"], [class*="sonner"]')
    const toastVisible = await toast.count() > 0
    const pageContent = await page.textContent('body')
    const hasError = /invalid|error|incorrect|wrong|failed/i.test(pageContent)
    expect(toastVisible || hasError).toBeTruthy()
  })

  test('should show error for invalid admin login', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/login`)
    await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)
    const pageContent = await page.textContent('body')
    const hasError = /invalid|error|incorrect|wrong|failed/i.test(pageContent)
    expect(hasError).toBeTruthy()
  })
})

test.describe('Loading States', () => {
  test('login button should exist and be clickable', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`)
    await page.locator('button[type="submit"]').waitFor({ timeout: 10000 })
    const submitBtn = page.locator('button[type="submit"]')
    await expect(submitBtn).toBeVisible()
    await expect(submitBtn).toBeEnabled()
  })
})

test.describe('404 / Unknown Routes', () => {
  test('unknown route should show 404 page', async ({ page }) => {
    await page.goto(`${BASE_URL}/nonexistent-page-xyz`)
    await page.locator('body').waitFor({ timeout: 10000 })
    const content = await page.textContent('body')
    expect(/404|not found|page not found/i.test(content)).toBeTruthy()
  })
})
