import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Expense CSV Upload', () => {
  test('should upload CSV and map columns', async ({ page }) => {
    await page.goto('/expenses/upload');
    
    // Create a dummy CSV
    const csvContent = 'Date,Description,Amount\n2024-05-18,Test Expense,100.00';
    const filePath = path.join(__dirname, 'test-expenses.csv');
    fs.writeFileSync(filePath, csvContent);

    // Upload file
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.click('text=Click or drag CSV here');
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);

    // Verify preview and mapping
    await expect(page.locator('text=Map your columns')).toBeVisible();
    await expect(page.locator('text=Data Preview')).toBeVisible();
    
    // Click import
    await page.click('button:has-text("Import Expenses")');
    
    // Should navigate back to expenses
    await expect(page).toHaveURL('/expenses');

    // Cleanup
    fs.unlinkSync(filePath);
  });
});
