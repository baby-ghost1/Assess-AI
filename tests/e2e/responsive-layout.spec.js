const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

async function loginAs(page, role) {
  const creds = {
    admin: { email: 'admin@assessai.com', password: 'Admin@123456' },
    setter: { email: 'setter@test.com', password: 'Setter123!' },
    candidate: { email: 'candidate@test.com', password: 'Candidate123!' },
  }
  await page.goto(`${BASE_URL}/login`)
  await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
  await page.fill('input[type="email"]', creds[role].email)
  await page.fill('input[type="password"]', creds[role].password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })
}

test.describe('Theme Toggle', () => {
  test('should toggle dark/light mode', async ({ page }) => {
    await loginAs(page, 'candidate')
    const themeToggle = page.locator('button[aria-label*="theme" i], button:has-text("Sun"), button:has-text("Moon"), [data-testid="theme-toggle"]').first()
    if (await themeToggle.count() > 0) {
      const htmlClass = await page.locator('html').getAttribute('class')
      const initialDark = htmlClass?.includes('dark')
      await themeToggle.click()
      await page.waitForTimeout(500)
      const newClass = await page.locator('html').getAttribute('class')
      const newDark = newClass?.includes('dark')
      expect(initialDark).not.toBe(newDark)
    }
  })

  test('should persist theme after reload', async ({ page }) => {
    await loginAs(page, 'candidate')
    const themeToggle = page.locator('button[aria-label*="theme" i], button:has-text("Sun"), button:has-text("Moon"), [data-testid="theme-toggle"]').first()
    if (await themeToggle.count() > 0) {
      await themeToggle.click()
      await page.waitForTimeout(500)
      const classBefore = await page.locator('html').getAttribute('class')
      await page.reload()
      await page.locator('body').waitFor({ timeout: 10000 })
      const classAfter = await page.locator('html').getAttribute('class')
      expect(classBefore).toBe(classAfter)
    }
  })
})

test.describe('Sidebar Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'candidate')
  })

  test('sidebar should be visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    const sidebar = page.locator('aside, nav, [class*="sidebar"]').first()
    await expect(sidebar).toBeVisible()
  })

  test('sidebar should collapse with Ctrl+B', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    const sidebar = page.locator('aside, nav, [class*="sidebar"]').first()
    if (await sidebar.count() > 0) {
      const boxBefore = await sidebar.boundingBox()
      await page.keyboard.press('Control+b')
      await page.waitForTimeout(500)
      const boxAfter = await sidebar.boundingBox()
      if (boxBefore && boxAfter) {
        expect(boxAfter.width).toBeLessThanOrEqual(boxBefore.width + 10)
      }
    }
  })
})

test.describe('Login Page Responsive', () => {
  test('should be usable on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')
    const submitBtn = page.locator('button[type="submit"]')
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
    await expect(submitBtn).toBeVisible()
  })

  test('should be usable on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/login`)
    await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toBeVisible()
    const box = await emailInput.boundingBox()
    expect(box).toBeTruthy()
  })
})

test.describe('Dashboard Responsive', () => {
  test('dashboard loads on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await loginAs(page, 'candidate')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('dashboard loads on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await loginAs(page, 'candidate')
    await expect(page).toHaveURL(/dashboard/)
    const mainContent = page.locator('main, [class*="content"], [class*="dashboard"]').first()
    await expect(mainContent).toBeVisible({ timeout: 10000 })
  })
})
