import { test, expect } from '@playwright/test';

test('mobile bottom navigation visibility', async ({ page }) => {
  await page.goto('/dashboard');
  
  if (page.url().includes('/login')) return;

  const bottomNav = page.locator('nav.fixed.bottom-0');
  
  // On desktop, it should be hidden
  await page.setViewportSize({ width: 1280, height: 800 });
  await expect(bottomNav).toBeHidden();
  
  // On mobile, it should be visible
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(bottomNav).toBeVisible();
  
  // Click on Invoices and check navigation
  await page.getByText('Invoices').click();
  await expect(page).toHaveURL(/\/invoices/);
});
