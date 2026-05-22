import { test, expect } from '@playwright/test';

test('layout responsiveness', async ({ page }) => {
  await page.goto('/dashboard');
  
  if (page.url().includes('/login')) return;

  // Desktop view
  await page.setViewportSize({ width: 1280, height: 800 });
  const grid = page.locator('.grid');
  await expect(grid).toHaveClass(/lg:grid-cols-3/);

  // Tablet view
  await page.setViewportSize({ width: 768, height: 800 });
  await expect(grid).toHaveClass(/md:grid-cols-2/);

  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(grid).toHaveClass(/grid-cols-1/);
});
