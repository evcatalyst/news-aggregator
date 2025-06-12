/**
 * Date Formatting E2E Test
 * Created: June 11, 2025
 * 
 * Tests that Tabulator correctly formats dates with Luxon
 */

import { test, expect } from '@playwright/test';
import { login, searchForNews } from './helpers';

test.describe('Date Formatting in Tabulator', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application and login
    await page.goto('/');
    await login(page);
  });

  test('formats dates correctly in news cards', async ({ page }) => {
    // Search for a topic that will include dates
    await searchForNews(page, 'latest technology news');
    
    // Wait for the card to be created and rendered
    await page.waitForSelector('.tabulator-table');
    
    // Get all date cells
    const dateCells = await page.$$('.tabulator-cell[tabulator-field="date"]');
    
    // Verify we have at least one date cell
    expect(dateCells.length).toBeGreaterThan(0);
    
    // Check each date cell for proper formatting
    for (const cell of dateCells) {
      const text = await cell.textContent();
      
      // Dates should follow the format: dd MMM yyyy HH:mm (e.g., "11 Jun 2025 14:30")
      // This regex checks for that pattern
      const dateRegex = /^\d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}$/;
      
      // Skip empty cells or cells with placeholder text
      if (text && text !== "(unknown)") {
        expect(text).toMatch(dateRegex);
      }
    }
  });

  test('handles invalid dates gracefully', async ({ page }) => {
    // This test would need to mock an invalid date response from the API
    // For now, we'll just check that our error handling code exists
    
    // Check if formatDateSafe function exists in the page context
    const hasFormatDateSafe = await page.evaluate(() => {
      // Look for the function in various possible locations
      return window.formatDateSafe !== undefined || 
             window.utils?.formatDateSafe !== undefined || 
             typeof formatDateSafe === 'function';
    });
    
    // This may fail if the function isn't exposed to the window object
    // In that case, adjust the test to match your implementation
    expect(hasFormatDateSafe).toBeTruthy();
  });
});
