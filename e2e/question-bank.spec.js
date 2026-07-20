import { test, expect } from '@playwright/test'
import { loginAsTestUser } from './helpers.js'

test.describe('Question Bank', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page)
  })

  test('should display question bank page', async ({ page }) => {
    await page.goto('/question-bank')
    await expect(page.getByRole('heading', { name: 'Question Bank' })).toBeVisible()
  })

  test('should create a single correct question', async ({ page }) => {
    const adminToken = process.env.E2E_ADMIN_TOKEN
    if (adminToken) {
      await page.evaluate((t) => localStorage.setItem('accessToken', t), adminToken)
    }
    await page.goto('/question-bank/create')
    await page.waitForSelector('h2:has-text("Create Question")')
    await page.getByPlaceholder("e.g. What is the capital of France?").fill('What is the capital of India?')
    await page.getByPlaceholder('Additional context or instructions...').fill('General knowledge')
    await page.locator('div:has(> label:text("Type *")) > select').selectOption('single_correct')
    await page.getByPlaceholder('Option A').fill('New Delhi')
    await page.getByPlaceholder('Option B').fill('Mumbai')
    await page.getByRole('button', { name: 'Add Option' }).click()
    await page.getByPlaceholder('Option C').fill('Kolkata')
    await page.getByRole('button', { name: 'Add Option' }).click()
    await page.getByPlaceholder('Option D').fill('Chennai')
    await page.getByRole('button', { name: 'Create Question' }).click()
    await page.waitForURL(/\/question-bank/, { timeout: 15000 })
    await page.waitForTimeout(2000)
  })

  test('should have action buttons', async ({ page }) => {
    await page.goto('/question-bank')
    await expect(page.getByRole('button', { name: 'New Question' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'AI Generate' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible()
  })

  test('should have search and filters', async ({ page }) => {
    await page.goto('/question-bank')
    await expect(page.getByPlaceholder('Search questions...')).toBeVisible()
    await expect(page.locator('select').nth(0)).toBeVisible()
  })
})
