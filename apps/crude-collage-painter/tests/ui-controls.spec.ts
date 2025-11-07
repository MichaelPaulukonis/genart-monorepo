import { test, expect } from '@playwright/test';

test('tweakpane zoom control changes the zoom level', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Take a screenshot of the initial state
  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Use keyboard to increase the zoom
  await page.keyboard.press('d'); // Enter drawing mode
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(100); // allow zoom to apply

  // Take a screenshot of the new state
  const newScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Compare the screenshots to verify the zoom has changed
  expect(newScreenshot).not.toEqual(initialScreenshot);
});
