import { test, expect } from '@playwright/test';

test('different composition modes generate different compositions', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('canvas');

  // Generate a composition with mode 1
  await page.keyboard.press('1');
  await page.waitForTimeout(1000);

  const screenshot1 = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Generate a composition with mode 2
  await page.keyboard.press('2');
  await page.waitForTimeout(1000);

  const screenshot2 = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // The two screenshots should be different
  expect(screenshot1).not.toEqual(screenshot2);
});
