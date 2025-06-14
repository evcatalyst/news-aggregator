import { test, expect } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

const LAYOUTS = ['mobile', 'tablet', 'desktop'];
const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 }
};

test.describe('Grid Layout Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Set up your test environment
    await page.goto('http://localhost:3000');
  });

  for (const layout of LAYOUTS) {
    test(`${layout} layout visual regression`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize(VIEWPORT_SIZES[layout]);
      
      // Wait for layout to stabilize
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshot = await page.screenshot();
      
      // Load baseline image if it exists
      const baselinePath = path.join(__dirname, `../screenshots/baseline/${layout}.png`);
      const diffPath = path.join(__dirname, `../screenshots/diff/${layout}.png`);
      
      if (!fs.existsSync(baselinePath)) {
        // First run - save baseline
        fs.writeFileSync(baselinePath, screenshot);
        test.skip();
        return;
      }

      const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
      const current = PNG.sync.read(screenshot);
      const { width, height } = baseline;
      const diff = new PNG({ width, height });

      // Compare images
      const mismatchedPixels = pixelmatch(
        baseline.data,
        current.data,
        diff.data,
        width,
        height,
        { threshold: 0.1 }
      );

      // Save diff if there are mismatches
      if (mismatchedPixels > 0) {
        fs.writeFileSync(diffPath, PNG.sync.write(diff));
      }

      // Assert difference is within threshold (0.5% of total pixels)
      const totalPixels = width * height;
      const threshold = totalPixels * 0.005;
      
      expect(mismatchedPixels).toBeLessThanOrEqual(threshold);
    });

    test(`${layout} layout transitions`, async ({ page }) => {
      await page.setViewportSize(VIEWPORT_SIZES[layout]);
      
      // Test layout transitions
      for (const targetLayout of LAYOUTS) {
        if (targetLayout === layout) continue;

        // Change layout
        await page.evaluate((layout) => {
          window.dispatchEvent(new CustomEvent('setLayout', { detail: layout }));
        }, targetLayout);

        // Wait for transition
        await page.waitForTimeout(500);

        // Take screenshot of transition
        const screenshot = await page.screenshot();
        
        // Save transition screenshot for review
        const transitionPath = path.join(
          __dirname,
          `../screenshots/transitions/${layout}-to-${targetLayout}.png`
        );
        fs.writeFileSync(transitionPath, screenshot);
      }
    });
  }

  test('layout responsiveness to window resize', async ({ page }) => {
    // Test various viewport sizes
    const viewportSizes = [
      { width: 320, height: 568 },  // iPhone SE
      { width: 375, height: 667 },  // iPhone 8
      { width: 768, height: 1024 }, // iPad
      { width: 1024, height: 768 }, // iPad landscape
      { width: 1440, height: 900 }  // Desktop
    ];

    for (const size of viewportSizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(500); // Wait for layout to adjust

      const screenshot = await page.screenshot();
      const screenshotPath = path.join(
        __dirname,
        `../screenshots/responsive/${size.width}x${size.height}.png`
      );
      fs.writeFileSync(screenshotPath, screenshot);
    }
  });
});
