import { test, expect } from '@playwright/test';

test('tweakpane zoom control changes the zoom level', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.tp-rotv'); // Tweakpane container

  // Take a screenshot of the initial state
  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Change the zoom value
  await page.click('button:has-text("Parameters")'); // Open the parameters tab
  const zoomInput = await page.locator('input[name="zoom"]');
  await zoomInput.fill('2.0');

  // Take a screenshot of the new state
  const newScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Compare the screenshots to verify the zoom has changed
  expect(newScreenshot).not.toEqual(initialScreenshot);
});
