import { test, expect } from '@playwright/test';

test.describe('Invoice PDF Preview', () => {
  test('should open PDF preview modal', async ({ page }) => {
    // Assuming we have at least one invoice, or we use a direct ID if we knew it
    // For this test we'll navigate to invoices and try to view the first one
    await page.goto('/invoices');
    
    const actionsMenu = page.locator('button:has(svg.lucide-more-horizontal)').first();
    if (await actionsMenu.isVisible()) {
      await actionsMenu.click();
      await page.click('text=View Details');
      
      await expect(page).toHaveURL(/\/invoices\/.+/);
      
      await page.click('button:has-text("Preview PDF")');
      await expect(page.locator('text=Invoice Preview')).toBeVisible();
      await expect(page.locator('iframe')).toBeVisible();
    }
  });
});
