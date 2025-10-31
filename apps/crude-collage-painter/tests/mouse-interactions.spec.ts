import { test, expect } from '@playwright/test';

test('can draw on canvas with mouse', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Get canvas position and dimensions
  const canvasBounds = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  // Perform drawing operation
  await page.keyboard.press('d'); // Enter drawing mode
  await page.mouse.move(canvasBounds.x + 100, canvasBounds.y + 100);
  await page.mouse.down();
  await page.mouse.move(canvasBounds.x + 200, canvasBounds.y + 200, { steps: 10 });
  await page.mouse.up();

  // Take screenshot to verify drawing occurred
  expect(await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  })).toMatchSnapshot('after-drawing.png');
});
