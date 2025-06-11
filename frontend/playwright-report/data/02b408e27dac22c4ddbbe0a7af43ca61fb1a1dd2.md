# Test info

- Name: Card Creation Issue Tests >> should prevent duplicate cards with identical content
- Location: /Users/matthew/Documents/projects/news-aggregator/frontend/src/__tests__/e2e/CardCreationIssue.test.js:218:3

# Error details

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('aside textarea[placeholder="Ask about news or create a card..."]')
    - locator resolved to 2 elements. Proceeding with the first one: <textarea rows="2" aria-label="Chat input" placeholder="Ask about news or create a card..." class="w-full p-2 text-xs bg-gray-900 text-gray-200 border border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
    - fill("Show me news about cats")
  - attempting fill action
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and editable
      - element is not visible
    - retrying fill action
      - waiting 100ms
    54 × waiting for element to be visible, enabled and editable
       - element is not visible
     - retrying fill action
       - waiting 500ms

    at /Users/matthew/Documents/projects/news-aggregator/frontend/src/__tests__/e2e/CardCreationIssue.test.js:253:16
```

# Page snapshot

```yaml
- banner:
  - button "Toggle sidebar": menu
  - heading "News Dashboard" [level=1]
  - button "Rebuild App"
  - button "Switch to dark mode": dark_mode
- main:
  - grid "News articles table":
    - rowgroup:
      - rowgroup:
        - row "Title Category Source Date Summary Actions":
          - columnheader "Title"
          - columnheader "Category"
          - columnheader "Source"
          - columnheader "Date"
          - columnheader "Summary"
          - columnheader "Actions"
    - rowgroup:
      - row "Initial News Article Other Initial Source 2025-06-10 Initial description Pin article 1 Remove article 1":
        - gridcell "Initial News Article":
          - link "Initial News Article":
            - /url: https://example.com/initial
        - gridcell "Other"
        - gridcell "Initial Source"
        - gridcell "2025-06-10"
        - gridcell "Initial description"
        - gridcell "Pin article 1 Remove article 1":
          - button "Pin article 1": push_pin Pin
          - button "Remove article 1": close Remove
    - text: Page Size
    - combobox "Page Size":
      - option "5" [selected]
      - option "10"
      - option "20"
    - button "First Page" [disabled]: First
    - button "Prev Page" [disabled]: Prev
    - button "Show Page 1": "1"
    - button "Next Page" [disabled]: Next
    - button "Last Page" [disabled]: Last
- contentinfo:
  - paragraph: © 2025 News Dashboard
  - link "Privacy":
    - /url: "#"
  - text: "|"
  - link "Terms":
    - /url: "#"
- complementary "Chat with Grok":
  - text: smart_toy Grok Assistant
  - button "Close sidebar": close
  - article:
    - paragraph: smart_toy Grok
    - paragraph: Hey there! Ask about news or create a card to get started.
    - time: 06:46 AM
  - textbox "Chat input"
  - text: Press Enter to send (Shift+Enter for new line)
  - button "Send message": Send
```

# Test source

```ts
  153 |         cardId: el.dataset.cardId,
  154 |         cardTitle: el.querySelector('.font-semibold')?.textContent?.trim(),
  155 |       }));
  156 |     });
  157 |     
  158 |     // Now search for cats (this was previously problematic)
  159 |     await page.evaluate(() => {
  160 |       document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
  161 |     });
  162 |     await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about cats');
  163 |     await page.click('aside button:has-text("Send")');
  164 |     
  165 |     // Wait for the cats card to be created
  166 |     await page.waitForSelector('text=New card created with 2 articles');
  167 |     
  168 |     // Check that both dog and cat articles exist simultaneously
  169 |     await expect(page.locator('text=Dog News Article')).toBeVisible();
  170 |     await expect(page.locator('text=Cat News Article')).toBeVisible();
  171 |     await expect(page.locator('text=Feline Research')).toBeVisible();
  172 |     
  173 |     // Count cards - should have 3 now (initial + dog + cat)
  174 |     const catCardCount = await page.locator('[data-card-id]').count();
  175 |     expect(catCardCount).toBe(3); 
  176 |     
  177 |     // Take another snapshot and compare to verify distinct cards were created
  178 |     const cardState2 = await page.evaluate(() => {
  179 |       return [...document.querySelectorAll('[data-card-id]')].map(el => ({
  180 |         cardId: el.dataset.cardId,
  181 |         cardTitle: el.querySelector('.font-semibold')?.textContent?.trim(),
  182 |       }));
  183 |     });
  184 |     
  185 |     // Verify the dog card still exists unchanged from the first state
  186 |     expect(cardState2.some(card => card.cardId === cardState1[0].cardId)).toBe(true);
  187 |     expect(cardState2.some(card => card.cardId === cardState1[1].cardId)).toBe(true);
  188 |     
  189 |     // Try a third search to ensure multiple cards are properly handled
  190 |     await page.evaluate(() => {
  191 |       document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
  192 |     });
  193 |     await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about birds');
  194 |     await page.click('aside button:has-text("Send")');
  195 |     
  196 |     // Wait for the third card to be created
  197 |     await page.waitForSelector('text=New card created with 1 article');
  198 |     
  199 |     // Now all three types of articles should be visible
  200 |     await expect(page.locator('text=Dog News Article')).toBeVisible();
  201 |     await expect(page.locator('text=Cat News Article')).toBeVisible();
  202 |     await expect(page.locator('text=News about show me news about birds')).toBeVisible();
  203 |     
  204 |     // Count cards - should have 4 now (initial + dog + cat + bird)
  205 |     const birdCardCount = await page.locator('[data-card-id]').count();
  206 |     expect(birdCardCount).toBe(4);
  207 |     
  208 |     // Take screenshot to verify all cards are visible with proper pagination
  209 |     await page.screenshot({ path: 'test-results/card-creation-test.png' });
  210 |     
  211 |     // Check console logs for any card creation errors
  212 |     if (consoleLogs.some(log => log.includes('failed') || log.includes('error') || log.includes('duplicate'))) {
  213 |       console.warn('Possible issues found in console logs:', 
  214 |         consoleLogs.filter(log => log.includes('failed') || log.includes('error') || log.includes('duplicate')));
  215 |     }
  216 |   });
  217 |
  218 |   test('should prevent duplicate cards with identical content', async ({ page }) => {
  219 |     // Wait a bit for the UI to stabilize
  220 |     await page.waitForTimeout(1000);
  221 |     
  222 |     // Open the chat sidebar (force visibility if needed)
  223 |     await page.evaluate(() => {
  224 |       // Ensure the sidebar toggle button is visible for mobile view
  225 |       const toggleBtn = document.querySelector('button[aria-label="Toggle sidebar"]');
  226 |       if (toggleBtn) {
  227 |         toggleBtn.style.display = 'block';
  228 |         toggleBtn.style.visibility = 'visible';
  229 |       }
  230 |     });
  231 |     await page.click('button[aria-label="Toggle sidebar"]');
  232 |     
  233 |     // Force the sidebar and input to be visible
  234 |     await page.evaluate(() => {
  235 |       const sidebars = document.querySelectorAll('aside');
  236 |       sidebars.forEach(sidebar => {
  237 |         sidebar.style.display = 'flex';
  238 |         sidebar.style.visibility = 'visible';
  239 |         sidebar.style.opacity = '1';
  240 |         const inputs = sidebar.querySelectorAll('textarea');
  241 |         inputs.forEach(input => {
  242 |           input.style.display = 'block';
  243 |           input.style.visibility = 'visible';
  244 |         });
  245 |       });
  246 |     });
  247 |     await page.waitForTimeout(500);
  248 |     
  249 |     // First search
  250 |     await page.evaluate(() => {
  251 |       document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
  252 |     });
> 253 |     await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about cats');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  254 |     await page.click('aside button:has-text("Send")');
  255 |     
  256 |     // Wait for card to be created
  257 |     await page.waitForSelector('text=New card created with 2 articles');
  258 |     
  259 |     // Try the exact same search again
  260 |     await page.evaluate(() => {
  261 |       document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
  262 |     });
  263 |     await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me news about cats');
  264 |     await page.click('aside button:has-text("Send")');
  265 |     
  266 |     // Wait for the response
  267 |     await page.waitForSelector('text=Here are some articles about show me news about cats', { state: 'visible' });
  268 |     
  269 |     // Should show error about duplicate card
  270 |     await page.waitForSelector('text=There was a problem creating the card');
  271 |     
  272 |     // There should still be only one instance of each cat article
  273 |     expect(await page.locator('text=Cat News Article').count()).toBe(1);
  274 |     expect(await page.locator('text=Feline Research').count()).toBe(1);
  275 |   });
  276 |
  277 |   test('should handle pagination for cards with many articles', async ({ page }) => {
  278 |     // Mock a response with many articles
  279 |     await page.route('http://localhost:3000/grok', async (route, request) => {
  280 |       const body = request.postDataJSON();
  281 |       if (body.prompt.toLowerCase().includes('many')) {
  282 |         // Create 15 articles for pagination testing - enough to ensure multiple pages
  283 |         const articles = Array(15).fill(null).map((_, i) => ({
  284 |           title: `Pagination Article ${i + 1}`,
  285 |           source: { name: 'Test Source' },
  286 |           description: `Description ${i + 1}`,
  287 |           publishedAt: new Date().toISOString(),
  288 |           url: `https://example.com/article${i + 1}`
  289 |         }));
  290 |         
  291 |         await route.fulfill({
  292 |           status: 200,
  293 |           contentType: 'application/json',
  294 |           body: JSON.stringify({
  295 |             response: 'Here are many articles for pagination testing',
  296 |             newsResults: articles
  297 |           })
  298 |         });
  299 |       }
  300 |     });
  301 |     
  302 |     // Wait a bit for the UI to stabilize
  303 |     await page.waitForTimeout(1000);
  304 |     
  305 |     // Open the chat sidebar (force visibility if needed)
  306 |     await page.evaluate(() => {
  307 |       // Ensure the sidebar toggle button is visible for mobile view
  308 |       const toggleBtn = document.querySelector('button[aria-label="Toggle sidebar"]');
  309 |       if (toggleBtn) {
  310 |         toggleBtn.style.display = 'block';
  311 |         toggleBtn.style.visibility = 'visible';
  312 |       }
  313 |     });
  314 |     await page.click('button[aria-label="Toggle sidebar"]');
  315 |     
  316 |     // Force the sidebar and input to be visible
  317 |     await page.evaluate(() => {
  318 |       const sidebars = document.querySelectorAll('aside');
  319 |       sidebars.forEach(sidebar => {
  320 |         sidebar.style.display = 'flex';
  321 |         sidebar.style.visibility = 'visible';
  322 |         sidebar.style.opacity = '1';
  323 |         const inputs = sidebar.querySelectorAll('textarea');
  324 |         inputs.forEach(input => {
  325 |           input.style.display = 'block';
  326 |           input.style.visibility = 'visible';
  327 |         });
  328 |       });
  329 |     });
  330 |     await page.waitForTimeout(500);
  331 |     
  332 |     // Search for many articles
  333 |     await page.evaluate(() => {
  334 |       document.querySelector('textarea[placeholder="Ask about news or create a card..."]').focus();
  335 |     });
  336 |     await page.fill('aside textarea[placeholder="Ask about news or create a card..."]', 'Show me many articles');
  337 |     await page.click('aside button:has-text("Send")');
  338 |     
  339 |     // Wait for card with many articles to be created
  340 |     await page.waitForSelector('text=New card created with 15 articles');
  341 |     
  342 |     // Check for pagination controls
  343 |     await expect(page.locator('.tabulator-paginator')).toBeVisible();
  344 |     
  345 |     // Verify the card content is visible
  346 |     await expect(page.locator('text=Pagination Article 1')).toBeVisible();
  347 |     
  348 |     // Get the card and pagination elements
  349 |     const card = await page.locator('[data-card-id]').last();
  350 |     const paginationControl = await page.locator('.tabulator-paginator').last();
  351 |     
  352 |     // Check that pagination controls aren't cut off
  353 |     const cardBounds = await card.boundingBox();
```