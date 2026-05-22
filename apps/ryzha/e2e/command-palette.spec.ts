import { test, expect } from '@playwright/test';

test('command palette navigation', async ({ page }) => {
  await page.goto('/dashboard');
  
  if (page.url().includes('/login')) return;

  // Press Meta+K
  await page.keyboard.press('Meta+K');
  
  const input = page.getByPlaceholderText('Type a command or search...');
  await expect(input).toBeVisible();
  
  await input.fill('invoice');
  await page.getByText('Invoices').click();
  
  await expect(page).toHaveURL(/\/invoices/);
});
