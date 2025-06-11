const { test, expect } = require('@playwright/test');

test.describe('News Aggregator E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mocks to avoid actual API calls
    await page.route('http://localhost:3000/news', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              title: 'Test News Article',
              source: { name: 'Test Source' },
              description: 'Test description for Playwright test',
              publishedAt: new Date().toISOString(),
              url: 'https://example.com/article'
            }
          ]
        })
      });
    });
    
    await page.route('http://localhost:3000/grok', async (route, request) => {
      const body = request.postDataJSON();
      const query = body.prompt.toLowerCase();
      
      // Respond with different news based on the query
      let newsArticles = [];
      if (query.includes('tech')) {
        newsArticles = [
          {
            title: 'Tech News Article',
            source: { name: 'Tech Source' },
            description: 'Technology description',
            publishedAt: new Date().toISOString(),
            url: 'https://tech.com/article'
          }
        ];
      } else if (query.includes('sport')) {
        newsArticles = [
          {
            title: 'Sports News Article',
            source: { name: 'Sports Source' },
            description: 'Sports description',
            publishedAt: new Date().toISOString(),
            url: 'https://sports.com/article'
          }
        ];
      }
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          response: `Here are some news articles about ${query}`,
          newsResults: newsArticles
        })
      });
    });
    
    // Navigate to the application
    await page.goto('/');
  });

  test('should load initial news data and render Tabulator table', async ({ page }) => {
    // Wait for Tabulator to render
    await page.waitForSelector('.tabulator');
    
    // Check for table headers
    const tableHeaders = await page.$$('.tabulator-col-title');
    expect(tableHeaders.length).toBeGreaterThan(0);
    
    // Check for header text
    const headerText = await Promise.all(
      tableHeaders.map(header => header.textContent())
    );
    expect(headerText).toContain('Title');
    
    // Check for rendered news article
    const articleCell = await page.waitForSelector('.tabulator-cell:has-text("Test News Article")');
    expect(articleCell).toBeTruthy();
  });

  test('should create a new card through chat interaction', async ({ page }) => {
    // Open the chat sidebar on mobile view
    await page.click('button[aria-label="Toggle sidebar"]');
    
    // Enter a search query
    await page.fill('textarea[placeholder="Ask about news or create a card..."]', 'Show me tech news');
    await page.click('button:has-text("Send")');
    
    // Wait for AI response
    await page.waitForSelector('text=Here are some news articles about show me tech news');
    
    // Wait for success message
    await page.waitForSelector('text=New card created with 1 article');
    
    // Check that a new card with Tech news was added
    await expect(page.locator('text=Tech News Article')).toBeVisible();
  });

  test('should create multiple distinct cards for different queries', async ({ page }) => {
    // Open the chat sidebar
    await page.click('button[aria-label="Toggle sidebar"]');
    
    // First query for tech news
    await page.fill('textarea[placeholder="Ask about news or create a card..."]', 'Show me tech news');
    await page.click('button:has-text("Send")');
    
    // Wait for success message
    await page.waitForSelector('text=New card created with 1 article');
    
    // Second query for sports news
    await page.fill('textarea[placeholder="Ask about news or create a card..."]', 'Show me sports news');
    await page.click('button:has-text("Send")');
    
    // Wait for success message for second card
    await page.waitForSelector('text=New card created with 1 article', { state: 'visible' });
    
    // Check that both cards exist
    const techArticle = await page.locator('text=Tech News Article').count();
    const sportsArticle = await page.locator('text=Sports News Article').count();
    
    expect(techArticle).toBe(1);
    expect(sportsArticle).toBe(1);
  });

  test('should handle pagination in Tabulator', async ({ page }) => {
    // Mock response with more articles to test pagination
    await page.route('http://localhost:3000/news', async (route) => {
      // Create 12 test articles
      const articles = Array(12).fill(null).map((_, i) => ({
        title: `Pagination Test Article ${i + 1}`,
        source: { name: 'Test Source' },
        description: `Description ${i + 1}`,
        publishedAt: new Date().toISOString(),
        url: `https://example.com/article${i + 1}`
      }));
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: articles })
      });
    });
    
    // Reload the page to get the new mock data
    await page.reload();
    
    // Wait for Tabulator to load
    await page.waitForSelector('.tabulator');
    
    // Check pagination exists
    await expect(page.locator('.tabulator-paginator')).toBeVisible();
    
    // Check we're on page 1
    const activePage = await page.locator('.tabulator-page.active');
    await expect(activePage).toHaveText('1');
    
    // Navigate to page 2
    await page.click('.tabulator-page:has-text("2")');
    
    // Check we're now on page 2
    const newActivePage = await page.locator('.tabulator-page.active');
    await expect(newActivePage).toHaveText('2');
    
    // Check different content is shown on page 2
    await page.waitForSelector('text=Pagination Test Article 6');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Mock API error
    await page.route('http://localhost:3000/news', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test server error' })
      });
    });
    
    // Reload page to trigger error
    await page.reload();
    
    // Check for error message
    await expect(page.locator('text=Error')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should have working dark mode toggle', async ({ page }) => {
    // Check initial state (light mode)
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    
    // Click dark mode toggle
    await page.click('button[aria-label*="dark mode"]');
    
    // Check dark mode is applied
    await expect(page.locator('html')).toHaveClass(/dark/);
    
    // Toggle back to light mode
    await page.click('button[aria-label*="light mode"]');
    
    // Check light mode is restored
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});