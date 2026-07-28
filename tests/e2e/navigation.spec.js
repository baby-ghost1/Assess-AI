const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

const CREDS = {
  admin: { email: 'admin@assessai.com', password: 'Admin@123456' },
  setter: { email: 'setter@test.com', password: 'Setter123!' },
  candidate: { email: 'candidate@test.com', password: 'Candidate123!' },
}

async function loginAs(page, role) {
  await page.goto(BASE_URL + '/login')
  await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
  await page.fill('input[type="email"]', CREDS[role].email)
  await page.fill('input[type="password"]', CREDS[role].password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })
  await page.locator('aside').waitFor({ timeout: 10000 })
}

test.describe('Sidebar Navigation', () => {
  test('admin sidebar is visible', async ({ page }) => {
    await loginAs(page, 'admin')
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })
  })

  test('setter sidebar is visible', async ({ page }) => {
    await loginAs(page, 'setter')
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })
  })

  test('candidate sidebar is visible', async ({ page }) => {
    await loginAs(page, 'candidate')
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible({ timeout: 5000 })
  })

  test('admin has navigation links in sidebar', async ({ page }) => {
    await loginAs(page, 'admin')
    const sidebarLinks = page.locator('aside a')
    await expect(sidebarLinks.first()).toBeVisible({ timeout: 10000 })
    const count = await sidebarLinks.count()
    expect(count).toBeGreaterThan(2)
  })

  test('setter has navigation links in sidebar', async ({ page }) => {
    await loginAs(page, 'setter')
    const sidebarLinks = page.locator('aside a')
    await expect(sidebarLinks.first()).toBeVisible({ timeout: 10000 })
    const count = await sidebarLinks.count()
    expect(count).toBeGreaterThan(2)
  })

  test('candidate has navigation links in sidebar', async ({ page }) => {
    await loginAs(page, 'candidate')
    const sidebarLinks = page.locator('aside a')
    await expect(sidebarLinks.first()).toBeVisible({ timeout: 10000 })
    const count = await sidebarLinks.count()
    expect(count).toBeGreaterThan(2)
  })
})

test.describe('Dashboard page loads', () => {
  test('admin sees admin dashboard', async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page).toHaveURL(/admin|dashboard/)
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })

  test('setter sees setter dashboard', async ({ page }) => {
    await loginAs(page, 'setter')
    await expect(page).toHaveURL(/dashboard/)
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })

  test('candidate sees candidate dashboard', async ({ page }) => {
    await loginAs(page, 'candidate')
    await expect(page).toHaveURL(/dashboard/)
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })
})

test.describe('Page navigation via sidebar', () => {
  test('admin sidebar links navigate correctly', async ({ page }) => {
    await loginAs(page, 'admin')
    const sidebarLinks = page.locator('aside a')
    const count = await sidebarLinks.count()
    const hrefs = []
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await sidebarLinks.nth(i).getAttribute('href')
      if (href) hrefs.push(href)
    }
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      if (href && !href.startsWith('http')) {
        await page.goto(BASE_URL + href)
        await page.locator('body').waitFor({ timeout: 10000 })
        expect(page.url()).toContain(href)
      }
    }
  })

  test('setter sidebar links navigate correctly', async ({ page }) => {
    await loginAs(page, 'setter')
    const sidebarLinks = page.locator('aside a')
    const count = await sidebarLinks.count()
    const hrefs = []
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await sidebarLinks.nth(i).getAttribute('href')
      if (href) hrefs.push(href)
    }
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      if (href && !href.startsWith('http')) {
        await page.goto(BASE_URL + href)
        await page.locator('body').waitFor({ timeout: 10000 })
        expect(page.url()).toContain(href)
      }
    }
  })

  test('candidate sidebar links navigate correctly', async ({ page }) => {
    await loginAs(page, 'candidate')
    const sidebarLinks = page.locator('aside a')
    const count = await sidebarLinks.count()
    const hrefs = []
    for (let i = 0; i < Math.min(count, 5); i++) {
      const href = await sidebarLinks.nth(i).getAttribute('href')
      if (href) hrefs.push(href)
    }
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) {
      if (href && !href.startsWith('http')) {
        await page.goto(BASE_URL + href)
        await page.locator('body').waitFor({ timeout: 10000 })
        expect(page.url()).toContain(href)
      }
    }
  })
})

test.describe('Root redirect', () => {
  test('/ redirects to dashboard or admin', async ({ page }) => {
    await page.goto(BASE_URL + '/')
    await page.waitForURL(/\/(dashboard|admin|login)/, { timeout: 15000 })
    expect(page.url()).toMatch(/\/(dashboard|admin|login)/)
  })
})
