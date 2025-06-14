import { test, expect } from '@playwright/test';

test.describe('Application Screenshots', () => {
  test.beforeEach(async ({ page }) => {
    // Wait for application to be fully loaded
    await page.goto('http://localhost:5173'); // Using Vite's default port
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Give React time to hydrate
    // Ensure consistent viewport for screenshots
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('capture main dashboard', async ({ page }) => {
    // Wait for content to load
    await page.waitForSelector('div[class*="grid"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '../../../docs/images/dashboard.png',
      fullPage: true 
    });
  });

  test('capture news grid view', async ({ page }) => {
    // Wait for grid to be visible and have some content
    await page.waitForSelector('div[class*="grid"]', { timeout: 10000 });
    await page.waitForSelector('div[class*="grid-cols"]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '../../../docs/images/news-grid.png',
      fullPage: true 
    });
  });

  test('capture AI-enhanced search', async ({ page }) => {
    // Wait for the page to be stable
    await page.waitForTimeout(2000);
    // Take a screenshot of the initial state
    await page.screenshot({ 
      path: '../../../docs/images/ai-search.png',
      fullPage: true 
    });
  });

  test('capture dark mode', async ({ page }) => {
    // Enable dark mode
    await page.evaluate(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    // Wait for dark mode to take effect
    await page.waitForTimeout(1000);
    await page.waitForSelector('div[class*="dark"]');
    await page.screenshot({ 
      path: '../../../docs/images/dark-mode.png',
      fullPage: true 
    });
  });

  test('capture data visualization', async ({ page }) => {
    // Check if visualization tab/button exists
    const hasViz = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(btn => btn.textContent.toLowerCase().includes('visualization'));
    });
    
    if (!hasViz) {
      console.log('Skipping visualization test - button not found');
      return;
    }

    // Click the visualization button and wait for content
    await page.click('button:has-text("visualization")');
    await page.waitForTimeout(2000);
    await page.screenshot({ 
      path: '../../../docs/images/data-viz.png',
      fullPage: true 
    });
  });
});
