import { test, expect } from '@playwright/test';

test.describe('Invoice List & Bulk Actions', () => {
  test('should filter and select invoices', async ({ page }) => {
    await page.goto('/invoices');
    
    // Check if table renders
    await expect(page.locator('table')).toBeVisible();
    
    // Search
    await page.fill('placeholder="Search invoices..."', 'Client');
    
    // Select an invoice
    const firstCheckbox = page.locator('table tbody tr [role="checkbox"]').first();
    await firstCheckbox.click();
    
    // Bulk actions should appear
    await expect(page.locator('text=1 selected')).toBeVisible();
    await expect(page.locator('button:has-text("Mark Paid")')).toBeVisible();
  });
});
