import { test, expect } from '@playwright/test';

test.skip('tweakpane mondrianStripes control changes the composition', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.tp-rotv'); // Tweakpane container

  // Generate a composition with mondrian stripes enabled
  await page.keyboard.press('7');
  await page.waitForTimeout(1000);

  const initialScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Disable mondrian stripes
  await page.click('button:has-text("Parameters")');
  const stripesCheckbox = await page.locator('input[name="mondrianStripes"]');
  await stripesCheckbox.uncheck();

  // Generate a new composition
  await page.keyboard.press('7');
  await page.waitForTimeout(1000);

  const newScreenshot = await page.screenshot({
    fullPage: false,
    clip: { x: 0, y: 0, width: 800, height: 600 }
  });

  // Compare the screenshots to verify the composition has changed
  expect(newScreenshot).not.toEqual(initialScreenshot);
});
