import { test, expect } from '@playwright/test';

test('can switch between modes', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Initial mode is Selecting
  const canvas = await page.locator('canvas');
  await expect(canvas).toHaveCSS('cursor', 'crosshair');
  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Switch to Drawing mode
  await page.keyboard.press('d');
  await expect(canvas).toHaveCSS('cursor', 'none');

  // Switch to Gallery mode
  await page.keyboard.press('g');
  await page.waitForTimeout(1000); // Allow time for gallery to render
  const galleryScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });
  expect(galleryScreenshot).not.toEqual(initialScreenshot);
});
