import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers.js'

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('should navigate via sidebar links', async ({ page }) => {
    const links = [
      { name: 'Assessments', url: /\/assessments$/ },
      { name: 'Question Bank', url: /\/question-bank$/ },
      { name: 'Analytics', url: /\/analytics$/ },
    ]
    for (const link of links) {
      await page.getByRole('link', { name: link.name }).click()
      await expect(page).toHaveURL(link.url)
    }
  })

  test('should show sidebar with all items', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('AssessAI')).toBeVisible()
  })
})
