import { test, expect } from '@playwright/test';

test('canvas renders with correct initial state', async ({ page }) => {
  await page.goto('/');
  // Wait for canvas to be fully rendered
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000); // Allow animations to settle

  // Take screenshot and compare with baseline
  expect(await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  })).toMatchSnapshot('initial-canvas.png');
});
