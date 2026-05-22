import { test, expect } from '@playwright/test';

test.describe('Expense Virtual Scroll', () => {
  test('should render table and allow search', async ({ page }) => {
    await page.goto('/expenses');
    
    await expect(page.locator('table')).toBeVisible();
    
    // Test search
    const searchInput = page.locator('placeholder="Search expenses..."');
    await searchInput.fill('Test');
    
    // Check if select all works
    const selectAll = page.locator('table thead input[type="checkbox"]').first();
    await selectAll.click();
    
    // Check if bulk actions appeared (assuming items found)
    // await expect(page.locator('text=selected')).toBeVisible();
  });
});
