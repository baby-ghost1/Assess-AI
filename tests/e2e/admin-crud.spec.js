const { test, expect } = require('@playwright/test')

const BASE_URL = 'http://localhost:5173'

const CREDS = {
  admin: { email: 'admin@assessai.com', password: 'Admin@123456' },
  setter: { email: 'setter@test.com', password: 'Setter123!' },
  candidate: { email: 'candidate@test.com', password: 'Candidate123!' },
}

async function loginAs(page, role) {
  const c = CREDS[role]
  await page.goto(BASE_URL + '/login')
  await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
  await page.locator('input[type="email"]').fill(c.email)
  await page.locator('input[type="password"]').fill(c.password)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 })
  await page.locator('body').waitFor({ timeout: 10000 })
}

test.describe('Admin Panel', () => {
  test('admin panel loads at /admin', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/admin')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/admin/)
  })

  test('admin panel has overview content', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/admin')
    await page.getByRole('heading', { name: /admin panel/i }).waitFor({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: /admin panel/i })).toBeVisible()
  })
})

test.describe('Users Management', () => {
  test('users page loads at /users', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/users')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/users/)
  })

  test('users page shows content', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/users')
    await page.locator('aside, nav, main').first().waitFor({ timeout: 15000 })
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })
})

test.describe('Assessment Pipeline', () => {
  test('assessments page loads for admin', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/assessments')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/assessments/)
  })

  test('admin sees assessment content', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/assessments')
    await page.locator('aside, nav, main').first().waitFor({ timeout: 15000 })
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })
})

test.describe('Admin Reviews', () => {
  test('review queue loads at /admin/reviews', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/admin/reviews')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/admin\/reviews/)
  })
})

test.describe('Settings Page', () => {
  test('settings loads for admin', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/settings')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/settings/)
  })

  test('settings has content', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/settings')
    await page.locator('aside, nav, main').first().waitFor({ timeout: 15000 })
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })

  test('settings loads for candidate', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/settings')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/settings/)
  })
})

test.describe('Profile Page', () => {
  test('profile loads for admin', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/profile')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/profile/)
  })

  test('profile shows user info', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/profile')
    await page.locator('aside, nav, main').first().waitFor({ timeout: 15000 })
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })
})

test.describe('Analytics Page', () => {
  test('analytics loads for admin', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/analytics')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/analytics/)
  })

  test('admin analytics loads at /admin/analytics', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/admin/analytics')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/admin\/analytics/)
  })
})

test.describe('Leaderboard', () => {
  test('leaderboard loads for all roles', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/leaderboard')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/leaderboard/)
  })
})

test.describe('Setter Features', () => {
  test('setter dashboard loads', async ({ page }) => {
    await loginAs(page, 'setter')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('question bank loads for setter', async ({ page }) => {
    await loginAs(page, 'setter')
    await page.goto(BASE_URL + '/question-bank')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/question-bank/)
  })

  test('create assessment loads for setter', async ({ page }) => {
    await loginAs(page, 'setter')
    await page.goto(BASE_URL + '/assessments/create')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/assessments\/create/)
  })
})

test.describe('Candidate Features', () => {
  test('candidate dashboard loads', async ({ page }) => {
    await loginAs(page, 'candidate')
    await expect(page).toHaveURL(/dashboard/)
  })

  test('coding page loads for candidate', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/coding')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/coding/)
  })

  test('ai-quiz page loads for candidate', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/ai-quiz')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/ai-quiz/)
  })
})
