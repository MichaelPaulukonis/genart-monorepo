import { test, expect } from '@playwright/test';

test('pressing "s" key saves the current composition', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Create a composition first
  await page.keyboard.press('1');
  await page.waitForTimeout(1000); // Allow time for composition to render

  // Monitor for download event
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('s');
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
