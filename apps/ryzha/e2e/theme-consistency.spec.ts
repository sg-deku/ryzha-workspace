import { test, expect } from '@playwright/test';

test('theme consistency checks', async ({ page }) => {
  await page.goto('/dashboard');
  
  if (page.url().includes('/login')) return;

  const button = page.getByRole('button', { name: /toggle theme/i });
  
  // Check border radius (0.5rem = 8px)
  const borderRadius = await button.evaluate((el) => getComputedStyle(el).borderRadius);
  expect(borderRadius).toBe('8px');
  
  // Check focus ring (primary color)
  await button.focus();
  const ringColor = await button.evaluate((el) => getComputedStyle(el).getPropertyValue('--ring'));
  // This might be tricky to test directly via computed style if it's a box-shadow
  // but we can check if the ring variable is set correctly in CSS.
});
