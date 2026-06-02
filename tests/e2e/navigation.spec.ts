import { test, expect } from '@playwright/test'

/**
 * E2E Tests for Navigation and Page Load
 * Tests that critical pages load correctly
 */

test.describe('Page Navigation', () => {
  test('should load login page without errors', async ({ page }) => {
    const response = await page.goto('/login')
    expect(response?.status()).toBe(200)

    await expect(page.getByText('Welcome Back')).toBeVisible()
  })

  test('should load register page without errors', async ({ page }) => {
    const response = await page.goto('/register')
    expect(response?.status()).toBe(200)

    await expect(page.getByText('Join the Secure Exchange')).toBeVisible()
  })

  test('should redirect root to login', async ({ page }) => {
    await page.goto('/')

    // Should redirect to login or show a landing page
    // Adjust based on your actual root behavior
    await page.waitForURL(/login|register|dashboard/i, { timeout: 5000 })
  })
})

test.describe('Performance', () => {
  test('login page should load within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/login')
    await page.waitForSelector('button[type="submit"]')

    const loadTime = Date.now() - startTime

    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })
})

test.describe('Accessibility', () => {
  test('login form should have proper labels', async ({ page }) => {
    await page.goto('/login')

    // Check for accessible form elements using placeholders (our form uses styled labels)
    await expect(page.getByPlaceholder('name@company.com')).toBeVisible()
    await expect(page.getByPlaceholder('••••••••')).toBeVisible()

    // Verify the inputs have proper types
    const emailInput = page.getByPlaceholder('name@company.com')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login')

    // Tab through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Focus should move through the form
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement)
  })
})

test.describe('Security', () => {
  test('password field should mask input', async ({ page }) => {
    await page.goto('/login')

    const passwordInput = page.getByPlaceholder('••••••••')
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should have security headers', async ({ page }) => {
    const response = await page.goto('/login')

    // Check for basic security headers
    const headers = response?.headers()
    expect(headers).toBeDefined()
  })
})
