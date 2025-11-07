import { test, expect } from '@playwright/test';

test.skip('pressing "b" key blends the image', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Generate a composition
  await page.keyboard.press('1');
  await page.waitForTimeout(1000);

  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Blend the image
  await page.keyboard.press('b');
  await page.waitForTimeout(1000);

  const newScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Compare the screenshots to verify the image was blended
  expect(newScreenshot).not.toEqual(initialScreenshot);
});
