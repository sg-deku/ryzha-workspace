import { test, expect } from "@playwright/test"

test("dashboard anomaly carousel can dismiss alert", async ({ page }) => {
  // First, we need to mock the API route to ensure we have an anomaly
  await page.route("/api/expenses/alert", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        json: [{ id: "mock-1", expense: { vendor: "Mock Vendor", amount: 9999 }, reason: "Mock Reason" }]
      })
    } else {
      await route.fulfill({ json: { success: true } })
    }
  })

  await page.goto("/login")
  await page.fill('input[type="email"]', "test@example.com")
  await page.fill('input[type="password"]', "password123")
  await page.click('button[type="submit"]')
  
  await page.waitForURL("/dashboard")
  
  // Wait for the carousel
  const carousel = page.locator('[data-testid="anomaly-carousel"]')
  await expect(carousel).toBeVisible()
  
  // Find the dismiss button and click it
  const dismissBtn = page.locator('button:has-text("Dismiss")').first()
  await dismissBtn.click()
  
  // Carousel should be hidden after dismissing the only item
  await expect(carousel).toBeHidden()
})