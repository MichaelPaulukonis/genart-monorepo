import { test, expect } from '@playwright/test';

test('drawing outside the canvas is clipped', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Draw a line that goes way off the canvas
  await page.keyboard.press('d'); // Enter drawing mode
  await page.mouse.move(100, 100);
  await page.mouse.down();
  await page.mouse.move(1000, 1000, { steps: 10 });
  await page.mouse.up();

  const screenshot1 = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Clear the canvas
  await page.keyboard.press('c');
  await page.waitForTimeout(1000);

  // Draw a line that goes just to the edge of the canvas
  await page.keyboard.press('d'); // Enter drawing mode
  await page.mouse.move(100, 100);
  await page.mouse.down();
  await page.mouse.move(599, 599, { steps: 10 });
  await page.mouse.up();

  const screenshot2 = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // The two screenshots should be identical
  expect(screenshot1).toEqual(screenshot2);
});
