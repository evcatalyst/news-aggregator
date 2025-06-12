const { test, expect } = require('@playwright/test');

test.describe('Card Interaction Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock initial news load
    await page.route('http://localhost:3000/news', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              title: 'Initial Tech Article',
              source: { name: 'Tech Source' },
              description: 'Initial tech description',
              publishedAt: new Date().toISOString(),
              url: 'https://example.com/tech'
            }
          ]
        })
      });
    });

    // Mock API responses for different categories
    await page.route('http://localhost:3000/grok', async (route, request) => {
      const body = request.postDataJSON();
      const query = body.prompt.toLowerCase();
      let newsArticles = [];

      // Different responses based on query category
      if (query.includes('tech')) {
        newsArticles = Array(5).fill(null).map((_, i) => ({
          title: `Tech Article ${i + 1}`,
          source: { name: 'Tech News' },
          description: `Description for tech article ${i + 1}`,
          publishedAt: new Date().toISOString(),
          url: `https://tech.com/article${i + 1}`
        }));
      } else if (query.includes('science')) {
        newsArticles = Array(3).fill(null).map((_, i) => ({
          title: `Science Article ${i + 1}`,
          source: { name: 'Science Daily' },
          description: `Description for science article ${i + 1}`,
          publishedAt: new Date().toISOString(),
          url: `https://science.com/article${i + 1}`
        }));
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: `Here are some articles about ${query}`,
          newsResults: newsArticles
        })
      });
    });

    await page.goto('/');
    await page.waitForSelector('.tabulator');
  });

  test('should show truncated content and expand on interaction', async ({ page }) => {
    // Create a card with long content
    await page.click('button[aria-label="Toggle sidebar"]');
    
    await page.evaluate(() => {
      const sidebars = document.querySelectorAll('aside');
      sidebars.forEach(sidebar => {
        sidebar.style.display = 'flex';
        sidebar.style.visibility = 'visible';
        sidebar.style.opacity = '1';
        const inputs = sidebar.querySelectorAll('textarea');
        inputs.forEach(input => {
          input.style.display = 'block';
          input.style.visibility = 'visible';
        });
      });
    });
    
    // Search for tech news (creates card with multiple articles)
    await page.fill('textarea[placeholder="Ask about news or create a card..."]', 'Show me tech news');
    await page.click('aside button:has-text("Send")');
    
    // Wait for card creation
    await page.waitForSelector('text=New card created with 5 articles');
    
    // Initial state - titles should be truncated
    const firstArticle = await page.locator('.tabulator-cell:has-text("Tech Article 1")').first();
    const initialBounds = await firstArticle.boundingBox();
    expect(initialBounds.height).toBeLessThan(100); // Truncated height
    
    // Hover over cell to see full content
    await firstArticle.hover();
    await page.waitForTimeout(500); // Wait for tooltip
    
    // Verify tooltip is visible with full content
    const tooltip = await page.locator('.tippy-box').first();
    expect(await tooltip.isVisible()).toBe(true);
    expect(await tooltip.textContent()).toContain('Tech Article 1');
  });

  test('should maintain card state during viewport resizing', async ({ page }) => {
    // Create tech and science cards
    await page.click('button[aria-label="Toggle sidebar"]');
    
    // Create tech card
    await page.fill('textarea[placeholder="Ask about news or create a card..."]', 'Show me tech news');
    await page.click('aside button:has-text("Send")');
    await page.waitForSelector('text=New card created with 5 articles');
    
    // Create science card
    await page.fill('textarea[placeholder="Ask about news or create a card..."]', 'Show me science news');
    await page.click('aside button:has-text("Send")');
    await page.waitForSelector('text=New card created with 3 articles');
    
    // Verify initial layout
    const initialCards = await page.locator('[data-card-id]').all();
    expect(initialCards.length).toBe(3); // Initial + tech + science
    
    // Take screenshot of initial layout
    await page.screenshot({ path: 'test-results/initial-card-layout.png' });
    
    // Resize to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Wait for resize
    
    // Verify cards are still present and visible
    const mobileCards = await page.locator('[data-card-id]').all();
    expect(mobileCards.length).toBe(3);
    
    // Take screenshot of mobile layout
    await page.screenshot({ path: 'test-results/mobile-card-layout.png' });
    
    // Verify content is still accessible
    await expect(page.locator('text=Tech Article 1')).toBeVisible();
    await expect(page.locator('text=Science Article 1')).toBeVisible();
  });

  test('should handle dark mode transitions gracefully', async ({ page }) => {
    // Create a card first
    await page.click('button[aria-label="Toggle sidebar"]');
    await page.fill('textarea[placeholder="Ask about news or create a card..."]', 'Show me tech news');
    await page.click('aside button:has-text("Send")');
    await page.waitForSelector('text=New card created with 5 articles');
    
    // Take screenshot in light mode
    await page.screenshot({ path: 'test-results/light-mode-card.png' });
    
    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(500); // Wait for transition
    
    // Take screenshot in dark mode
    await page.screenshot({ path: 'test-results/dark-mode-card.png' });
    
    // Verify card is still properly styled and visible
    const card = await page.locator('[data-card-id]').last();
    const cardBounds = await card.boundingBox();
    
    // Card should maintain proper dimensions
    expect(cardBounds.width).toBeGreaterThan(300);
    expect(cardBounds.height).toBeGreaterThan(200);
    
    // Verify text is still readable
    await expect(page.locator('text=Tech Article 1')).toBeVisible();
  });
});
