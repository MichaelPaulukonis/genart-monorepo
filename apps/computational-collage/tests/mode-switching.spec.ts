import { test, expect } from '@playwright/test';

test('can switch between drawing and gallery modes', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Initial mode is Drawing
  const galleryOverlay = await page.locator('#overlay');
  await expect(galleryOverlay).not.toBeVisible();

  // Switch to Gallery mode
  await page.keyboard.press('g');
  await expect(galleryOverlay).toBeVisible();

  // Switch back to Drawing mode
  await page.keyboard.press('g');
  await expect(galleryOverlay).not.toBeVisible();
});
