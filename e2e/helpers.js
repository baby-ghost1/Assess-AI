export function getTestUser() {
  return {
    name: 'Test User',
    email: process.env.E2E_EMAIL || 'test@e2e-test.com',
    password: process.env.E2E_PASSWORD || 'TestPass123!',
  }
}

export async function loginAsTestUser(page) {
  const user = getTestUser()
  const token = process.env.E2E_ACCESS_TOKEN
  if (token) {
    await page.goto('/dashboard')
    await page.evaluate((t) => localStorage.setItem('accessToken', t), token)
    await page.goto('/dashboard')
    await page.waitForTimeout(1000)
    return
  }

  await page.goto('/login')
  await page.getByPlaceholder('you@example.com').fill(user.email)
  await page.locator('input[name="password"]').fill(user.password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15000 })
}

export async function loginAsAdmin(page) {
  const token = process.env.E2E_ADMIN_TOKEN
  if (token) {
    await page.goto('/admin')
    await page.evaluate((t) => localStorage.setItem('accessToken', t), token)
    await page.goto('/admin')
    await page.waitForTimeout(1000)
    return
  }
  await page.goto('/admin/login')
  await page.getByPlaceholder('admin@assessai.com').fill('admin@assessai.com')
  await page.locator('input[type="password"]').fill('Admin@123456')
  await page.getByRole('button', { name: 'Access Admin Panel' }).click()
  await page.waitForURL(/\/admin/, { timeout: 15000 })
}

export async function createQuestion(page, question) {
  await page.goto('/question-bank/create')
  await page.waitForSelector('h2:has-text("Create Question")')
  await page.getByPlaceholder('e.g. What is the capital of France?').fill(question.title)
  if (question.description) {
    await page.getByPlaceholder('Additional context or instructions...').fill(question.description)
  }
  if (question.type) {
    await page.getByLabel('Type *').selectOption(question.type)
  }
  if (question.options) {
    for (let i = 0; i < question.options.length; i++) {
      if (i > 0) {
        await page.getByRole('button', { name: 'Add Option' }).click()
        await page.waitForTimeout(200)
      }
      await page.getByPlaceholder(`Option ${String.fromCharCode(65 + i)}`).fill(question.options[i])
    }
  }
  await page.getByRole('button', { name: 'Create Question' }).click()
  await page.waitForURL(/\/question-bank/, { timeout: 15000 })
}
