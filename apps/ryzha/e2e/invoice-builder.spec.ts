import { test, expect } from '@playwright/test';

test.describe('Invoice Builder', () => {
  test('should create a new invoice with line items', async ({ page }) => {
    await page.goto('/invoices/new');
    
    // Fill client info
    await page.fill('input[id="clientName"]', 'Test Client');
    await page.fill('input[id="clientEmail"]', 'test@client.com');
    
    // Edit first line item
    const firstRow = page.locator('table tbody tr').first();
    await firstRow.locator('input').first().fill('Consulting Services');
    
    // Add new item
    await page.click('button:has-text("Add Item")');
    const rowCount = await page.locator('table tbody tr').count();
    expect(rowCount).toBe(2);
    
    // Check total calculation
    await expect(page.locator('text=Total')).toBeVisible();
  });
});
