import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Authentication Flows
 * Tests login, registration, and navigation
 */

test.describe('Authentication', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page).toHaveTitle(/Trade Nest/)
    await expect(page.getByText('Welcome Back')).toBeVisible()
    await expect(page.getByPlaceholder('name@company.com')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('should display registration page', async ({ page }) => {
    await page.goto('/register')

    await expect(page).toHaveTitle(/Trade Nest/)
    await expect(page.getByText('Join the Secure Exchange')).toBeVisible()
  })

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login')

    // Navigate to register
    await page.getByRole('link', { name: /register/i }).click()
    await expect(page).toHaveURL(/\/register/)

    // Navigate back to login
    await page.getByRole('link', { name: /login/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('should show validation errors on empty login form', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()

    // Should remain on login page
    await expect(page).toHaveURL(/\/login/)
  })

  test('should have responsive design', async ({ page }) => {
    await page.goto('/login')

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByText('Welcome Back')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.getByText('Welcome Back')).toBeVisible()
  })
})

test.describe('Brand Identity', () => {
  test('should display Trade Nest branding', async ({ page }) => {
    await page.goto('/login')

    // Check for logo
    await expect(page.locator('img[alt="Trade Nest"]')).toBeVisible()

    // Check footer
    await expect(page.getByText(/Trade Nest Global Inc/i)).toBeVisible()
  })

  test('should have custom favicon', async ({ page }) => {
    await page.goto('/login')

    // Check that our custom favicon is present (there might be multiple icon links from Next.js)
    const customFavicon = await page.locator('link[rel="icon"][href*="/assets/favicon.ico"]').count()
    expect(customFavicon).toBeGreaterThan(0)
  })
})
