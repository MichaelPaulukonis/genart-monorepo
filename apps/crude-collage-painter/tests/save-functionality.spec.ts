import { test, expect } from '@playwright/test';

test('pressing "s" key saves the current composition', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Create a composition first
  await page.keyboard.press('d');
  await page.mouse.move(100, 100);
  await page.mouse.down();
  await page.mouse.move(200, 200);
  await page.mouse.up();

  // Monitor for download event
  const downloadPromise = page.waitForEvent('download');
  await page.keyboard.press('s');
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/\.png$/);
});
