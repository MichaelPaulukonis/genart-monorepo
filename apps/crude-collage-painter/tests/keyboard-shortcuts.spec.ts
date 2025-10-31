import { test, expect } from '@playwright/test';

test('pressing "c" key clears the canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Create a composition first
  await page.keyboard.press('d');
  await page.mouse.move(100, 100);
  await page.mouse.down();
  await page.mouse.move(200, 200);
  await page.mouse.up();

  // Take a screenshot of the drawn composition
  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Clear the canvas
  await page.keyboard.press('c');
  await page.waitForTimeout(1000);

  // Take a screenshot of the cleared canvas
  const newScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Compare the screenshots to verify the canvas was cleared
  expect(newScreenshot).not.toEqual(initialScreenshot);
});
