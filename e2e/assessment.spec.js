import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers.js'

test.describe('Assessments', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('should display assessments page', async ({ page }) => {
    await page.goto('/assessments')
    await expect(page.getByRole('heading', { name: 'Assessments' })).toBeVisible()
  })

  test('should show type filter buttons', async ({ page }) => {
    await page.goto('/assessments')
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Quiz' })).toBeVisible()
  })

  test('should display create assessment page', async ({ page }) => {
    await page.goto('/assessments/create')
    await expect(page.getByRole('heading', { name: 'Create Assessment' })).toBeVisible()
  })

  test('should have form fields', async ({ page }) => {
    await page.goto('/assessments/create')
    await expect(page.getByPlaceholder('e.g. JavaScript Fundamentals')).toBeVisible()
    await expect(page.getByPlaceholder('No limit')).toBeVisible()
  })

  test('should have toggle checkboxes', async ({ page }) => {
    await page.goto('/assessments/create')
    const shuffleChk = page.locator('label').filter({ hasText: 'Shuffle Questions' }).locator('input[type="checkbox"]')
    await shuffleChk.check()
    await expect(shuffleChk).toBeChecked()
    await shuffleChk.uncheck()
    await expect(shuffleChk).not.toBeChecked()
  })

  test('should have sections section', async ({ page }) => {
    await page.goto('/assessments/create')
    await expect(page.getByText('Sections')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Section' })).toBeVisible()
  })
})
