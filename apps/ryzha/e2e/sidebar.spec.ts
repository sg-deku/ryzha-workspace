import { test, expect } from '@playwright/test';

test('sidebar collapse functionality', async ({ page }) => {
  await page.goto('/dashboard');
  
  if (page.url().includes('/login')) return;

  const aside = page.locator('aside');
  
  // Initial width should be 256px (w-64)
  await expect(aside).toHaveCSS('width', '256px');
  
  // Click collapse button
  await page.getByRole('button', { name: /collapse/i }).click();
  
  // Width should change to 72px (w-[72px])
  await expect(aside).toHaveCSS('width', '72px');
  
  // Refresh page and check if state persisted in localStorage
  await page.reload();
  await expect(aside).toHaveCSS('width', '72px');
});
