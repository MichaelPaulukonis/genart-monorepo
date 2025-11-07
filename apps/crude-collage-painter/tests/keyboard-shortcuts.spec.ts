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
  await page.waitForTimeout(100); // allow drawing to register

  // Clear the canvas
  await page.keyboard.press('c');
  await page.waitForTimeout(100); // allow canvas to clear

  // Get the color of a pixel in the center of the canvas
  const pixelColor = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
    return [pixelData[0], pixelData[1], pixelData[2], pixelData[3]];
  });

  // Assert that the pixel is white
  expect(pixelColor).toEqual([255, 255, 255, 255]);
});
