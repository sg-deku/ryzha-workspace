import { test, expect } from "@playwright/test"

test("dashboard cashflow chart is interactive", async ({ page }) => {
  await page.goto("/login")
  await page.fill('input[type="email"]', "test@example.com")
  await page.fill('input[type="password"]', "password123")
  await page.click('button[type="submit"]')
  
  await page.waitForURL("/dashboard")
  
  // Verify chart renders
  const chart = page.locator('[data-testid="cashflow-chart"]')
  await expect(chart).toBeVisible()
  
  // Hover over chart to see tooltip
  await chart.hover({ position: { x: 100, y: 100 } })
  
  // Recharts tooltip has class .recharts-tooltip-wrapper
  const tooltip = page.locator('.recharts-tooltip-wrapper')
  await expect(tooltip).toBeVisible()
})