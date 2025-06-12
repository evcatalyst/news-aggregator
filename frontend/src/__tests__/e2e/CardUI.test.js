import { test, expect } from '@playwright/test';

test('card creation with real-world content', async ({ page }) => {
  // Route API requests
  await page.route('http://localhost:3000/grok', async (route) => {
    const body = route.request().postDataJSON();
    const query = body.prompt.toLowerCase();
    let newsArticles = [];

    // Simulate different article sets based on queries
    if (query.includes('dogs')) {
      newsArticles = [
        {
          title: 'How To Keep Your Dog Comfortable And Your Home Clean On Rainy Days',
          source: { name: 'Forbes' },
          description: 'We rounded up expert tips and handy products for making the best out of wet weather—whether you have a tiny terrier or a huge hound.',
          publishedAt: '2025-05-29T14:30:00Z',
          url: 'https://forbes.com/dog-care-rain'
        },
        {
          title: 'The 6 Best Dog Harnesses, Tested And Approved By Our Own Pups',
          source: { name: 'Forbes' },
          description: 'The best dog harnesses are easy to put on, comfortable and durable. Based on rigorous testing, these are our top picks.',
          publishedAt: '2025-05-12T09:15:00Z',
          url: 'https://forbes.com/best-dog-harnesses'
        }
      ];
    } else if (query.includes('cats')) {
      newsArticles = [
        {
          title: 'New Study Reveals How Cats Process Human Language',
          source: { name: 'Science Daily' },
          description: 'Groundbreaking research shows cats can distinguish their names and common household words.',
          publishedAt: '2025-06-09T16:45:00Z',
          url: 'https://sciencedaily.com/cats-language'
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

  // Open chat sidebar
  await page.click('button[aria-label="Toggle sidebar"]');

  // Search for dogs
  await page.fill('textarea[placeholder*="Ask about news"]', 'Show me news about dogs');
  await page.click('button:has-text("Send")');

  // Wait for card to be created
  await page.waitForSelector('text=How To Keep Your Dog Comfortable');

  // Verify card structure
  await expect(page.locator('.material-icons:has-text("push_pin")')).toBeVisible();
  await expect(page.locator('.material-icons:has-text("close")')).toBeVisible();
  
  // Check content layout
  const titleElement = page.locator('h3:has-text("dogs")');
  const titleBox = await titleElement.boundingBox();
  const headerElement = titleElement.locator('xpath=ancestor::div[contains(@class, "bg-gray-50")]');
  const headerBox = await headerElement.boundingBox();
  
  // Verify compact header (height should be reasonable)
  expect(headerBox.height).toBeLessThan(60); // Header should be compact

  // Test card interactions
  await page.click('button[title="Pin card"]');
  await expect(page.locator('text="How To Keep Your Dog Comfortable"')).toBeVisible();

  // Create another card
  await page.fill('textarea[placeholder*="Ask about news"]', 'Show me news about cats');
  await page.click('button:has-text("Send")');

  // Verify multiple cards
  await expect(page.locator('text="New Study Reveals How Cats Process"')).toBeVisible();
  
  // Both cards should be visible
  await expect(page.locator('text="How To Keep Your Dog Comfortable"')).toBeVisible();
  await expect(page.locator('text="New Study Reveals How Cats"')).toBeVisible();
});

test('card behavior with long content', async ({ page }) => {
  // Route API requests with extra long content
  await page.route('http://localhost:3000/grok', async (route) => {
    const newsArticles = [{
      title: 'This is an extremely long article title that should be properly truncated in the UI to maintain a clean layout while still showing the important information'
        .repeat(2),
      source: { name: 'Very Long Source Name That Should Be Handled Gracefully In The Interface' },
      description: 'This is an extremely detailed description that goes into great depth about the topic and should be properly handled by the UI truncation'
        .repeat(3),
      publishedAt: '2025-06-10T10:00:00Z',
      url: 'https://example.com/long-article'
    }];

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        response: 'Here are some articles',
        newsResults: newsArticles
      })
    });
  });

  await page.goto('/');
  await page.click('button[aria-label="Toggle sidebar"]');
  await page.fill('textarea[placeholder*="Ask about news"]', 'Show me some news');
  await page.click('button:has-text("Send")');

  // Wait for card to be created
  await page.waitForSelector('text=This is an extremely long article');

  // Check that long content is handled properly
  const titleElement = page.locator('h3');
  const summaryElement = page.locator('text="This is an extremely detailed description"');
  
  // Title should be visible but truncated
  await expect(titleElement).toBeVisible();
  const titleBox = await titleElement.boundingBox();
  expect(titleBox.width).toBeLessThan(800); // Should not expand too wide

  // Summary should be visible but truncated
  await expect(summaryElement).toBeVisible();
  const summaryBox = await summaryElement.boundingBox();
  expect(summaryBox.width).toBeLessThan(800);
});
