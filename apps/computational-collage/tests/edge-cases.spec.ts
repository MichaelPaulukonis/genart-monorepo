import { test, expect } from '@playwright/test';

test.skip('generating a composition with no images does not change the canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Clear all images
  await page.keyboard.press('g'); // enter gallery
  await page.evaluate(() => {
    document.querySelectorAll('.gallery-image').forEach(el => el.classList.add('selected'));
  });
  await page.keyboard.press('x'); // delete selected
  await page.keyboard.press('g'); // exit gallery


  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Try to generate a composition
  await page.keyboard.press('1');
  await page.waitForTimeout(1000);

  const newScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // The two screenshots should be identical
  expect(newScreenshot).toEqual(initialScreenshot);
});
