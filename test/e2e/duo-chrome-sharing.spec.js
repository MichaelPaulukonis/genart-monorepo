import { test, expect } from '@playwright/test';

test.describe('Duo-Chrome App - URL Sharing Feature', () => {

  test.describe('State Restoration', () => {
    test('should restore composition from a full set of URL parameters', async ({ page }) => {
      // Define a specific state to test
      const params = new URLSearchParams({
        imageA: '1',
        imageB: '2',
        colorA: 'RED',
        colorB: 'BLUE',
        scaleA: '1.20',
        scaleB: '0.80',
        blendMode: '3',
        bgMode: '1',
        palette: '1', // Use palette 1 which is an array
        active: '0',
        v: '1'
      });

      await page.goto(`/?${params.toString()}`);

      // Wait for the async image loading and state update to complete
      await expect.poll(async () => page.locator('#status-color-a').textContent()).toBe('RED');

      // Verify the status display reflects the restored state
      await expect(page.locator('#status-color-b')).toHaveText('BLUE');
      await expect(page.locator('#status-scale-a')).toHaveText('1.20');
      await expect(page.locator('#status-scale-b')).toHaveText('0.80');

      // Verify the visual output by taking a snapshot now that state is confirmed
      await expect(page.locator('#defaultCanvas0')).toHaveScreenshot('restored-composition.png');
    });

    test('should handle partial or invalid URL parameters gracefully', async ({ page }) => {
      // Test with only one image specified
      const params = new URLSearchParams({
        imageA: '5',
        colorA: 'BLACK',
        palette: '1' // Use a valid palette
      });

      await page.goto(`/?${params.toString()}`);
      
      // Wait for the app to settle
      await expect.poll(async () => page.locator('#status-color-a').textContent()).toBe('BLACK');

      // Expect the canvas to still render something without errors
      const canvas = page.locator('#defaultCanvas0');
      const boundingBox = await canvas.boundingBox();
      expect(boundingBox.width).toBeGreaterThan(0);
      await expect(canvas).toHaveScreenshot('partial-params-restoration.png');
    });
  });

  test.describe('State Serialization', () => {
    test('should generate a share URL that reflects the current state', async ({ page }) => {
      // Start from a known state
      const initialParams = new URLSearchParams({
        imageA: '1',
        imageB: '2',
        colorA: 'RED',
        colorB: 'BLUE',
        palette: '1', // Use a valid palette
        scaleA: '1.00',
        scaleB: '1.00'
      });
      await page.goto(`/?${initialParams.toString()}`);
      
      // Wait for the initial state to be fully loaded
      await expect.poll(async () => page.locator('#status-color-a').textContent()).toBe('RED');

      // --- Perform actions to change the state ---
      // 1. Change active image to B
      await page.keyboard.press('b');
      
      // 2. Change Image B's scale
      await page.keyboard.press('ArrowUp'); // scaleB -> 1.10
      await page.keyboard.press('ArrowUp'); // scaleB -> 1.20

      // 3. Change Image B's color
      await page.keyboard.press('Control+ArrowRight');

      // Wait for async operations triggered by keyboard shortcuts
      await page.waitForTimeout(500);

      // --- Trigger the share action ---
      await page.keyboard.press('Shift+S');

      // --- Verify the URL ---
      const finalUrl = page.url();
      
      // Check that the scale for B was updated
      expect(finalUrl).toContain('scaleB=1.20');
      
      // Check that the active image is now B
      expect(finalUrl).toContain('active=1');

      // Check that the color for B is no longer the original
      expect(finalUrl).not.toContain('colorB=BLUE');

      // Check that other params are preserved
      expect(finalUrl).toContain('imageA=1');
      expect(finalUrl).toContain('colorA=RED');
    });
  });
});
