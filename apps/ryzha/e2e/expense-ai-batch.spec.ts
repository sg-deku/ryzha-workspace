import { test, expect } from '@playwright/test';

test.describe('Expense AI Batch Categorize', () => {
  test('should trigger batch categorization and show progress', async ({ page }) => {
    await page.goto('/expenses');
    
    const categorizeBtn = page.locator('button:has-text("Categorize All")');
    if (await categorizeBtn.isEnabled()) {
      await categorizeBtn.click();
      
      await expect(page.locator('text=AI Categorization in Progress')).toBeVisible();
      await expect(page.locator('role=progressbar')).toBeVisible();
    }
  });
});
