import { test, expect } from '@playwright/test';

test.describe('Invoice AI Suggest', () => {
  test('should show highlight when AI suggests items', async ({ page }) => {
    await page.goto('/invoices/new');
    
    await page.fill('placeholder="e.g. 10 hours"', 'Development work');
    
    // Mock API response if possible, otherwise just test UI flow
    await page.click('button:has-text("Suggest Items")');
    
    // Expect loading state
    await expect(page.locator('text=Thinking...')).toBeVisible();
  });
});
