import { test, expect } from "@playwright/test"

test("dashboard activity feed loads and links work", async ({ page }) => {
  await page.goto("/login")
  await page.fill('input[type="email"]', "test@example.com")
  await page.fill('input[type="password"]', "password123")
  await page.click('button[type="submit"]')
  
  await page.waitForURL("/dashboard")
  
  // Verify activity feed renders
  await expect(page.locator("text=Recent Activity")).toBeVisible()
  
  // Click on the first activity item
  const firstItem = page.locator("text=Invoice #INV-001 created")
  await firstItem.click()
  
  // Verify it navigates to invoices page
  await page.waitForURL("/invoices")
  await expect(page).toHaveURL("/invoices")
})