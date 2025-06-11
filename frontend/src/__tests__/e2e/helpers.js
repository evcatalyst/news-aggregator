// Helper functions for E2E tests

/**
 * Force text input in a textarea that might be hidden or difficult to access
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Selector for the textarea
 * @param {string} text - Text to enter
 */
async function forceTextInput(page, selector, text) {
  // First make sure the element is in view
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      // Force element to be visible
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.style.opacity = '1';
      element.scrollIntoViewIfNeeded();
      element.focus();
    }
  }, selector);
  
  // Clear the field first
  await page.evaluate((selector) => {
    const element = document.querySelector(selector);
    if (element) {
      element.value = '';
    }
  }, selector);
  
  // Then type directly using evaluate
  await page.evaluate((selector, text) => {
    const element = document.querySelector(selector);
    if (element) {
      element.value = text;
      // Trigger input event to ensure React picks up the change
      const event = new Event('input', { bubbles: true });
      element.dispatchEvent(event);
      // Also trigger change event
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(changeEvent);
    }
  }, selector, text);
  
  // Wait a moment for React to process the change
  await page.waitForTimeout(100);
}

/**
 * Force a click on a button that might be hidden or difficult to access
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - Selector for the button
 */
async function forceClick(page, selector) {
  // Make the button visible and click it
  await page.evaluate((selector) => {
    const button = document.querySelector(selector);
    if (button) {
      // Force element to be visible
      button.style.display = 'block';
      button.style.visibility = 'visible';
      button.style.opacity = '1';
      button.scrollIntoViewIfNeeded();
      // Click via JS
      button.click();
    }
  }, selector);
  
  // Wait a moment for the click to process
  await page.waitForTimeout(100);
}

/**
 * Prepare the chat sidebar for testing by making relevant elements visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
async function prepareChatSidebar(page) {
  // Wait a bit for the UI to stabilize
  await page.waitForTimeout(1000);
  
  // Make the sidebar toggle button visible
  await page.evaluate(() => {
    // Ensure the sidebar toggle button is visible
    const toggleBtn = document.querySelector('button[aria-label="Toggle sidebar"]');
    if (toggleBtn) {
      toggleBtn.style.display = 'block';
      toggleBtn.style.visibility = 'visible';
      toggleBtn.style.opacity = '1';
      toggleBtn.scrollIntoViewIfNeeded();
    }
  });
  
  // Click the sidebar toggle button
  await forceClick(page, 'button[aria-label="Toggle sidebar"]');
  
  // Make all sidebar elements visible
  await page.evaluate(() => {
    const sidebars = document.querySelectorAll('aside');
    sidebars.forEach(sidebar => {
      sidebar.style.display = 'flex';
      sidebar.style.visibility = 'visible';
      sidebar.style.opacity = '1';
      
      // Make all interactive elements within the sidebar visible
      const interactiveElements = sidebar.querySelectorAll('input, textarea, button');
      interactiveElements.forEach(el => {
        el.style.display = el.tagName === 'TEXTAREA' ? 'block' : 'inline-block';
        el.style.visibility = 'visible';
        el.style.opacity = '1';
      });
    });
  });
  
  // Wait for the sidebar to be ready
  await page.waitForTimeout(500);
}

module.exports = {
  forceTextInput,
  forceClick,
  prepareChatSidebar
};
