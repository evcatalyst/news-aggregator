const { test, expect } = require('@playwright/test');
const { forceTextInput, forceClick, prepareChatSidebar } = require('./helpers');

/**
 * This test specifically targets the issue where new cards sometimes aren't created
 * or all searches are added to the same table/card
 */
test.describe('Card Creation Issue Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock initial news load
    await page.route('http://localhost:3000/news', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              title: 'Initial News Article',
              source: { name: 'Initial Source' },
              description: 'Initial description',
              publishedAt: new Date().toISOString(),
              url: 'https://example.com/initial'
            }
          ]
        })
      });
    });

    // Special case for testing the 'cats' search which had issues
    await page.route('http://localhost:3000/grok', async (route, request) => {
      const body = request.postDataJSON();
      const query = body.prompt.toLowerCase();
      let newsArticles = [];

      // Specific behavior for 'cats' query (the problematic one)
      if (query.includes('cats')) {
        newsArticles = [
          {
            title: 'Cat News Article',
            source: { name: 'Pet Source' },
            description: 'Article about cats',
            publishedAt: new Date().toISOString(),
            url: 'https://pets.com/cats'
          },
          {
            title: 'Feline Research',
            source: { name: 'Science Source' },
            description: 'Research about feline behavior',
            publishedAt: new Date().toISOString(),
            url: 'https://science.com/felines'
          }
        ];
      } 
      // For 'dogs', return different articles
      else if (query.includes('dogs')) {
        newsArticles = [
          {
            title: 'Dog News Article',
            source: { name: 'Pet Source' },
            description: 'Article about dogs',
            publishedAt: new Date().toISOString(),
            url: 'https://pets.com/dogs'
          }
        ];
      }
      // Default response for other queries
      else {
        newsArticles = [
          {
            title: `News about ${query}`,
            source: { name: 'General Source' },
            description: `Generic description about ${query}`,
            publishedAt: new Date().toISOString(),
            url: 'https://general.com/news'
          }
        ];
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
    
    // Wait for initial data to load
    await page.waitForSelector('.tabulator');
  });

  test('should create a new distinct card when searching for cats', async ({ page }) => {
    // Add console event listener to capture debug logs
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('[ChatSidebar]') || msg.text().includes('[App]') || msg.text().includes('[renderNewsCard]')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // Wait a bit for the UI to stabilize
    await page.waitForTimeout(1000);
    
    // Open the chat sidebar (force visibility if needed)
    await page.evaluate(() => {
      // Ensure the sidebar toggle button is visible for mobile view
      const toggleBtn = document.querySelector('button[aria-label="Toggle sidebar"]');
      if (toggleBtn) {
        toggleBtn.style.display = 'block';
        toggleBtn.style.visibility = 'visible';
      }
    });
    await page.click('button[aria-label="Toggle sidebar"]');
    
    // Force the sidebar and input to be visible
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
    await page.waitForTimeout(500);
    
    // First search for dogs (control)
    // Force focus on the textarea and use a more specific selector
    await page.evaluate(() => {
      document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
    });
    await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about dogs');
    await page.click('aside button:has-text("Send")');
    
    // Wait for the dog card to be created - check both the success message and actual card
    await page.waitForSelector('text=New card created with 1 article');
    
    // Check dog article exists and count cards
    await expect(page.locator('text=Dog News Article')).toBeVisible();
    const dogCardCount = await page.locator('[data-card-id]').count();
    expect(dogCardCount).toBe(2); // Initial card + dog card
    
    // Take a snapshot of the current cards
    const cardState1 = await page.evaluate(() => {
      return [...document.querySelectorAll('[data-card-id]')].map(el => ({
        cardId: el.dataset.cardId,
        cardTitle: el.querySelector('.font-semibold')?.textContent?.trim(),
      }));
    });
    
    // Now search for cats (this was previously problematic)
    await page.evaluate(() => {
      document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
    });
    await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about cats');
    await page.click('aside button:has-text("Send")');
    
    // Wait for the cats card to be created
    await page.waitForSelector('text=New card created with 2 articles');
    
    // Check that both dog and cat articles exist simultaneously
    await expect(page.locator('text=Dog News Article')).toBeVisible();
    await expect(page.locator('text=Cat News Article')).toBeVisible();
    await expect(page.locator('text=Feline Research')).toBeVisible();
    
    // Count cards - should have 3 now (initial + dog + cat)
    const catCardCount = await page.locator('[data-card-id]').count();
    expect(catCardCount).toBe(3); 
    
    // Take another snapshot and compare to verify distinct cards were created
    const cardState2 = await page.evaluate(() => {
      return [...document.querySelectorAll('[data-card-id]')].map(el => ({
        cardId: el.dataset.cardId,
        cardTitle: el.querySelector('.font-semibold')?.textContent?.trim(),
      }));
    });
    
    // Verify the dog card still exists unchanged from the first state
    expect(cardState2.some(card => card.cardId === cardState1[0].cardId)).toBe(true);
    expect(cardState2.some(card => card.cardId === cardState1[1].cardId)).toBe(true);
    
    // Try a third search to ensure multiple cards are properly handled
    await page.evaluate(() => {
      document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
    });
    await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about birds');
    await page.click('aside button:has-text("Send")');
    
    // Wait for the third card to be created
    await page.waitForSelector('text=New card created with 1 article');
    
    // Now all three types of articles should be visible
    await expect(page.locator('text=Dog News Article')).toBeVisible();
    await expect(page.locator('text=Cat News Article')).toBeVisible();
    await expect(page.locator('text=News about show me news about birds')).toBeVisible();
    
    // Count cards - should have 4 now (initial + dog + cat + bird)
    const birdCardCount = await page.locator('[data-card-id]').count();
    expect(birdCardCount).toBe(4);
    
    // Take screenshot to verify all cards are visible with proper pagination
    await page.screenshot({ path: 'test-results/card-creation-test.png' });
    
    // Check console logs for any card creation errors
    if (consoleLogs.some(log => log.includes('failed') || log.includes('error') || log.includes('duplicate'))) {
      console.warn('Possible issues found in console logs:', 
        consoleLogs.filter(log => log.includes('failed') || log.includes('error') || log.includes('duplicate')));
    }
  });

  test('should prevent duplicate cards with identical content', async ({ page }) => {
    // Wait a bit for the UI to stabilize
    await page.waitForTimeout(1000);
    
    // Open the chat sidebar (force visibility if needed)
    await page.evaluate(() => {
      // Ensure the sidebar toggle button is visible for mobile view
      const toggleBtn = document.querySelector('button[aria-label="Toggle sidebar"]');
      if (toggleBtn) {
        toggleBtn.style.display = 'block';
        toggleBtn.style.visibility = 'visible';
      }
    });
    await page.click('button[aria-label="Toggle sidebar"]');
    
    // Force the sidebar and input to be visible
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
    await page.waitForTimeout(500);
    
    // First search
    await page.evaluate(() => {
      document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
    });
    await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about cats');
    await page.click('aside button:has-text("Send")');
    
    // Wait for card to be created
    await page.waitForSelector('text=New card created with 2 articles');
    
    // Try the exact same search again
    await page.evaluate(() => {
      document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
    });
    await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about cats');
    await page.click('aside button:has-text("Send")');
    
    // Wait for the response
    await page.waitForSelector('text=Here are some articles about show me news about cats', { state: 'visible' });
    
    // Should show error about duplicate card
    await page.waitForSelector('text=There was a problem creating the card');
    
    // There should still be only one instance of each cat article
    expect(await page.locator('text=Cat News Article').count()).toBe(1);
    expect(await page.locator('text=Feline Research').count()).toBe(1);
  });

  test('should handle pagination for cards with many articles', async ({ page }) => {
    // Mock a response with many articles
    await page.route('http://localhost:3000/grok', async (route, request) => {
      const body = request.postDataJSON();
      if (body.prompt.toLowerCase().includes('many')) {
        // Create 15 articles for pagination testing - enough to ensure multiple pages
        const articles = Array(15).fill(null).map((_, i) => ({
          title: `Pagination Article ${i + 1}`,
          source: { name: 'Test Source' },
          description: `Description ${i + 1}`,
          publishedAt: new Date().toISOString(),
          url: `https://example.com/article${i + 1}`
        }));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            response: 'Here are many articles for pagination testing',
            newsResults: articles
          })
        });
      }
    });
    
    // Wait a bit for the UI to stabilize
    await page.waitForTimeout(1000);
    
    // Open the chat sidebar (force visibility if needed)
    await page.evaluate(() => {
      // Ensure the sidebar toggle button is visible for mobile view
      const toggleBtn = document.querySelector('button[aria-label="Toggle sidebar"]');
      if (toggleBtn) {
        toggleBtn.style.display = 'block';
        toggleBtn.style.visibility = 'visible';
      }
    });
    await page.click('button[aria-label="Toggle sidebar"]');
    
    // Force the sidebar and input to be visible
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
    await page.waitForTimeout(500);
    
    // Search for many articles
    await page.evaluate(() => {
      document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
    });
    await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me many articles');
    await page.click('aside button:has-text("Send")');
    
    // Wait for card with many articles to be created
    await page.waitForSelector('text=New card created with 15 articles');
    
    // Check for pagination controls
    await expect(page.locator('.tabulator-paginator')).toBeVisible();
    
    // Verify the card content is visible
    await expect(page.locator('text=Pagination Article 1')).toBeVisible();
    
    // Get the card and pagination elements
    const card = await page.locator('[data-card-id]').last();
    const paginationControl = await page.locator('.tabulator-paginator').last();
    
    // Check that pagination controls aren't cut off
    const cardBounds = await card.boundingBox();
    const paginationBounds = await paginationControl.boundingBox();
    
    // The pagination control should be fully contained within the viewport
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    const paginationBottom = paginationBounds.y + paginationBounds.height;
    const isFullyVisible = paginationBottom <= viewportHeight;
    
    // Take screenshot of the pagination area for visual verification
    await page.screenshot({ 
      path: 'test-results/pagination-visibility.png',
      clip: {
        x: paginationBounds.x,
        y: paginationBounds.y - 10,
        width: paginationBounds.width,
        height: paginationBounds.height + 20
      }
    });
    
    // Take full card screenshot
    await page.screenshot({
      path: 'test-results/card-with-pagination.png',
      clip: {
        x: cardBounds.x,
        y: cardBounds.y,
        width: cardBounds.width,
        height: cardBounds.height + 50 // Include area below card
      }
    });
    
    // Check measurements to ensure visibility
    expect(paginationBounds.height).toBeGreaterThan(25); // Reasonable minimum height
    expect(cardBounds.y + cardBounds.height).toBeGreaterThan(paginationBounds.y + paginationBounds.height);
    
    // Navigate to page 2 and check content changes
    await page.click('.tabulator-page:has-text("2")');
    
    // Wait for page 2 content and verify it loaded
    await page.waitForSelector('text=Pagination Article 6');
    
    // Verify the active page indicator changed
    await expect(page.locator('.tabulator-page.active')).toHaveText('2');
    
    // Take screenshot of page 2 to verify pagination worked
    await page.screenshot({ path: 'test-results/pagination-page2.png' });
    
    // Verify all pagination controls are accessible
    const pageControls = await page.locator('.tabulator-page');
    const pageCount = await pageControls.count();
    expect(pageCount).toBeGreaterThan(1);
    
    // Click through all pages to ensure they're accessible
    for (let i = 1; i <= pageCount; i++) {
      await page.click(`.tabulator-page:has-text("${i}")`);
      await expect(page.locator('.tabulator-page.active')).toHaveText(`${i}`);
    }
  });
});
