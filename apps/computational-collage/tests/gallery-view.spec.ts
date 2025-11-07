import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.skip('can load an image by dropping it onto the canvas', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  const imagePath = path.resolve(__dirname, 'dummy-image.png');
  const imageBuffer = fs.readFileSync(imagePath);
  const imageBase64 = imageBuffer.toString('base64');

  const dataTransfer = await page.evaluateHandle((imageBase64) => {
    const byteCharacters = atob(imageBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' });
    const file = new File([blob], 'dummy-image.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    return dt;
  }, imageBase64);

  await page.dispatchEvent('canvas', 'drop', { dataTransfer });

  await page.waitForTimeout(1000);

  const newScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  expect(newScreenshot).not.toEqual(initialScreenshot);
});
