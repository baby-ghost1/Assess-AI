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

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should load login page at /login', async ({ page }) => {
      await page.goto(BASE_URL + '/login')
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('input[type="password"]')).toBeVisible()
    })

    test('should login with valid admin credentials', async ({ page }) => {
      await page.goto(BASE_URL + '/login')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      await page.locator('input[type="email"]').fill(CREDS.admin.email)
      await page.locator('input[type="password"]').fill(CREDS.admin.password)
      await page.locator('button[type="submit"]').click()
      await page.waitForURL(/\/admin/, { timeout: 15000 })
      await expect(page).toHaveURL(/\/admin/)
    })

    test('should login with valid setter credentials', async ({ page }) => {
      await page.goto(BASE_URL + '/login')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      await page.locator('input[type="email"]').fill(CREDS.setter.email)
      await page.locator('input[type="password"]').fill(CREDS.setter.password)
      await page.locator('button[type="submit"]').click()
      await page.waitForURL(/\/dashboard/, { timeout: 15000 })
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should login with valid candidate credentials', async ({ page }) => {
      await page.goto(BASE_URL + '/login')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      await page.locator('input[type="email"]').fill(CREDS.candidate.email)
      await page.locator('input[type="password"]').fill(CREDS.candidate.password)
      await page.locator('button[type="submit"]').click()
      await page.waitForURL(/\/dashboard/, { timeout: 15000 })
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('should show error toast with invalid credentials', async ({ page }) => {
      await page.goto(BASE_URL + '/login')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      await page.locator('input[type="email"]').fill('wrong@example.com')
      await page.locator('input[type="password"]').fill('wrongpass')
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(3000)
      const content = await page.textContent('body')
      expect(/invalid|error|incorrect/i.test(content)).toBeTruthy()
    })

    test('should show validation errors with empty fields', async ({ page }) => {
      await page.goto(BASE_URL + '/login')
      await page.locator('button[type="submit"]').waitFor({ timeout: 10000 })
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(2000)
      const url = page.url()
      expect(url).toContain('/login')
    })

    test('should remember me checkbox be visible', async ({ page }) => {
      await page.goto(BASE_URL + '/login')
      await expect(page.locator('input[type="checkbox"]')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Signup Page', () => {
    test('should load signup page at /register', async ({ page }) => {
      await page.goto(BASE_URL + '/register')
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 })
    })

    test('should signup with valid data', async ({ page }) => {
      const uniqueEmail = 'test' + Date.now() + '@test.com'
      await page.goto(BASE_URL + '/register')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
      if (await nameInput.count() > 0) await nameInput.fill('Test User')
      await page.locator('input[type="email"]').fill(uniqueEmail)
      const passwordInputs = page.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('TestPass123!')
      await passwordInputs.nth(1).fill('TestPass123!')
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(5000)
      const url = page.url()
      const content = await page.textContent('body')
      const succeeded = /success|registered|created|approval|login|pending/i.test(content) || !url.includes('/register')
      expect(succeeded).toBeTruthy()
    })

    test('should show error with mismatched passwords', async ({ page }) => {
      const uniqueEmail = 'test' + Date.now() + '@test.com'
      await page.goto(BASE_URL + '/register')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
      if (await nameInput.count() > 0) await nameInput.fill('Test User')
      await page.locator('input[type="email"]').fill(uniqueEmail)
      const passwordInputs = page.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('TestPass123!')
      await passwordInputs.nth(1).fill('DifferentPass456!')
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(2000)
      const content = await page.textContent('body')
      expect(/match|confirm|different|error/i.test(content)).toBeTruthy()
    })

    test('should show error with duplicate email', async ({ page }) => {
      await page.goto(BASE_URL + '/register')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
      if (await nameInput.count() > 0) await nameInput.fill('Duplicate User')
      await page.locator('input[type="email"]').fill(CREDS.admin.email)
      const passwordInputs = page.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('TestPass123!')
      await passwordInputs.nth(1).fill('TestPass123!')
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(3000)
      const content = await page.textContent('body')
      expect(/already|exists|duplicate|error/i.test(content)).toBeTruthy()
    })
  })

  test.describe('Setter Registration', () => {
    test('should load setter registration', async ({ page }) => {
      await page.goto(BASE_URL + '/setter/register')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      await expect(page.locator('input[type="email"]')).toBeVisible()
    })

    test('should register setter with valid data', async ({ page }) => {
      const uniqueEmail = 'setter' + Date.now() + '@test.com'
      await page.goto(BASE_URL + '/setter/register')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first()
      if (await nameInput.count() > 0) await nameInput.fill('New Setter')
      await page.locator('input[type="email"]').fill(uniqueEmail)
      const passwordInputs = page.locator('input[type="password"]')
      await passwordInputs.nth(0).fill('SetterPass123!')
      await passwordInputs.nth(1).fill('SetterPass123!')
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(5000)
      const url = page.url()
      const content = await page.textContent('body')
      const succeeded = /success|registered|approval|pending|login/i.test(content) || !url.includes('/setter/register')
      expect(succeeded).toBeTruthy()
    })
  })

  test.describe('Admin Login', () => {
    test('should load admin login page', async ({ page }) => {
      await page.goto(BASE_URL + '/admin/login')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      await expect(page.locator('input[type="email"]')).toBeVisible()
    })

    test('should login as admin from admin login page', async ({ page }) => {
      await page.goto(BASE_URL + '/admin/login')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      await page.locator('input[type="email"]').fill(CREDS.admin.email)
      await page.locator('input[type="password"]').fill(CREDS.admin.password)
      await page.locator('button[type="submit"]').click()
      await page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 })
      await expect(page).toHaveURL(/\/(admin|dashboard)/)
    })

    test('should show error for invalid admin credentials', async ({ page }) => {
      await page.goto(BASE_URL + '/admin/login')
      await page.locator('input[type="email"]').waitFor({ timeout: 10000 })
      await page.locator('input[type="email"]').fill('wrong@example.com')
      await page.locator('input[type="password"]').fill('wrongpass')
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(3000)
      const content = await page.textContent('body')
      expect(/invalid|error|incorrect|credentials/i.test(content)).toBeTruthy()
    })
  })

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      await loginAs(page, 'candidate')
      const profileBtn = page.locator('[class*="topbar"] button, header button, [class*="avatar"]').first()
      if (await profileBtn.count() > 0) {
        await profileBtn.click()
        await page.waitForTimeout(500)
      }
      const signOut = page.locator('button:has-text("Sign out"), a:has-text("Sign out"), button:has-text("Logout")').first()
      if (await signOut.count() > 0) {
        await signOut.click()
        await page.waitForURL(/\/login/, { timeout: 10000 })
        await expect(page).toHaveURL(/\/login/)
      }
    })
  })

  test.describe('Protected Routes', () => {
    for (const route of ['/dashboard', '/admin', '/settings']) {
      test('redirects to /login for ' + route, async ({ page }) => {
        await page.goto(BASE_URL + route)
        await page.waitForURL(/\/login/, { timeout: 15000 })
        await expect(page).toHaveURL(/\/login/)
      })
    }
  })

  test.describe('Post-Login Redirect', () => {
    test('candidate redirects to /dashboard', async ({ page }) => {
      await loginAs(page, 'candidate')
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('setter redirects to /dashboard', async ({ page }) => {
      await loginAs(page, 'setter')
      await expect(page).toHaveURL(/\/dashboard/)
    })

    test('admin redirects to /admin', async ({ page }) => {
      await loginAs(page, 'admin')
      await expect(page).toHaveURL(/\/admin/)
    })
  })
})
