import { test, expect } from '@playwright/test';

test('clicking a mode button generates a new composition', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Take a screenshot of the initial state
  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Click the "mode 1" button
  await page.click('button:has-text("mode 1")');
  await page.waitForTimeout(1000); // Allow time for composition to render

  // Take a screenshot of the new state
  const newScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Compare the screenshots to verify a new composition was generated
  expect(newScreenshot).not.toEqual(initialScreenshot);
});
