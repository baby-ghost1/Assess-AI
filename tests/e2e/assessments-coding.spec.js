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
}

test.describe('Assessments Page', () => {
  test('setter sees assessments', async ({ page }) => {
    await loginAs(page, 'setter')
    await page.goto(BASE_URL + '/assessments')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/assessments/)
  })

  test('candidate sees assessments', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/assessments')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/assessments/)
  })

  test('admin sees assessments', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/assessments')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/assessments/)
  })
})

test.describe('Create Assessment', () => {
  test('form loads for setter', async ({ page }) => {
    await loginAs(page, 'setter')
    await page.goto(BASE_URL + '/assessments/create')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/assessments\/create/)
  })

  test('form loads for admin', async ({ page }) => {
    await loginAs(page, 'admin')
    await page.goto(BASE_URL + '/assessments/create')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/assessments\/create/)
  })
})

test.describe('Coding Page', () => {
  test('loads with Hello World problem', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/coding')
    await page.locator('aside, nav, main').first().waitFor({ timeout: 15000 })
    await expect(page).toHaveURL(/\/coding/)
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })

  test('code editor is visible', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/coding')
    await page.locator('.monaco-editor, [class*="editor"], [role="code"]').first().waitFor({ timeout: 15000 })
    const editor = page.locator('.monaco-editor, [class*="editor"], [role="code"]').first()
    await expect(editor).toBeVisible()
  })

  test('run button exists', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/coding')
    await page.locator('body').waitFor({ timeout: 10000 })
    const runBtn = page.locator('button:has-text("Run")').first()
    await expect(runBtn).toBeVisible()
  })

  test('submit button exists', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/coding')
    await page.locator('body').waitFor({ timeout: 10000 })
    const submitBtn = page.locator('button:has-text("Submit")').first()
    await expect(submitBtn).toBeVisible()
  })

  test('AI toggle button exists', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/coding')
    await page.locator('body').waitFor({ timeout: 10000 })
    const aiBtn = page.locator('button:has-text("AI")').first()
    await expect(aiBtn).toBeVisible()
  })

  test('problem description visible', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/coding')
    await page.locator('aside, nav, main').first().waitFor({ timeout: 15000 })
    const content = await page.textContent('body')
    expect(content.length).toBeGreaterThan(50)
  })
})

test.describe('AI Quiz Page', () => {
  test('loads for candidate', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/ai-quiz')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/ai-quiz/)
  })
})

test.describe('Leaderboard', () => {
  test('loads for candidate', async ({ page }) => {
    await loginAs(page, 'candidate')
    await page.goto(BASE_URL + '/leaderboard')
    await page.locator('body').waitFor({ timeout: 10000 })
    await expect(page).toHaveURL(/\/leaderboard/)
  })
})
