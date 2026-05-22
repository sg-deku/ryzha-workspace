import { test, expect } from "@playwright/test"

test("dashboard kpi cards load and display sparklines", async ({ page }) => {
  // Login first
  await page.goto("/login")
  await page.fill('input[type="email"]', "test@example.com")
  await page.fill('input[type="password"]', "password123")
  await page.click('button[type="submit"]')
  
  // Wait for navigation
  await page.waitForURL("/dashboard")
  
  // Check that KPI cards appear
  await expect(page.locator("text=MRR")).toBeVisible()
  await expect(page.locator("text=Cash Balance")).toBeVisible()
  
  // Check sparkline wrapper
  const sparklines = page.locator('[data-testid="sparkline"]')
  await expect(sparklines).toHaveCount(4)
})