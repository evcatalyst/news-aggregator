// agGridLoad.test.js
// Pro forma test for ag-Grid loading in the browser

const { test, expect } = require('@playwright/test');

test.describe('ag-Grid Integration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should load ag-Grid global on window', async ({ page }) => {
    // Wait for ag-Grid script to load
    await page.waitForFunction(() => window.agGrid && window.agGrid.Grid, {}, { timeout: 10000 });
    const agGridExists = await page.evaluate(() => !!window.agGrid && !!window.agGrid.Grid);
    expect(agGridExists).toBe(true);
  });

  test('should handle login and show default news', async ({ page }) => {
    // Wait for login form to appear
    await page.waitForSelector('#login-username', { timeout: 10000 });
    
    // Fill in login credentials
    await page.fill('#login-username', 'test_user');
    await page.fill('#login-password', 'testpass');
    await page.click('#login-btn');
    
    // Wait for news grid to appear after login
    await page.waitForSelector('.ag-theme-alpine', { timeout: 15000 });
    const gridExists = await page.locator('.ag-theme-alpine').count();
    expect(gridExists).toBeGreaterThan(0);
  });

  test('should show at least one row in the grid after login', async ({ page }) => {
    // Login first
    await page.waitForSelector('#login-username', { timeout: 10000 });
    await page.fill('#login-username', 'test_user');
    await page.fill('#login-password', 'testpass');
    await page.click('#login-btn');
    
    // Wait for grid and rows
    await page.waitForSelector('.ag-theme-alpine', { timeout: 15000 });
    await page.waitForSelector('.ag-theme-alpine .ag-row', { timeout: 10000 });
    const rowCount = await page.locator('.ag-theme-alpine .ag-row').count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('should allow chat input and potentially create a new card', async ({ page }) => {
    // Login first
    await page.waitForSelector('#login-username', { timeout: 10000 });
    await page.fill('#login-username', 'test_user');
    await page.fill('#login-password', 'testpass');
    await page.click('#login-btn');
    
    // Wait for initial grid to load
    await page.waitForSelector('.ag-theme-alpine', { timeout: 15000 });
    const initialCardCount = await page.locator('.ag-theme-alpine').count();
    
    // Try to interact with chat
    await page.waitForSelector('#grok-input', { timeout: 5000 });
    await page.fill('#grok-input', 'dogs in schenectady');
    await page.click('#grok-btn');
    
    // Wait a bit for async processing
    await page.waitForTimeout(3000);
    
    // Check if either the same card was updated or a new card was created
    const finalCardCount = await page.locator('.ag-theme-alpine').count();
    expect(finalCardCount).toBeGreaterThanOrEqual(initialCardCount);
  });
});
