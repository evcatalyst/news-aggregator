# Automated UI Testing for Tabulator and Chat/News Card Flow

This project uses Playwright for end-to-end UI testing. The main test file is `tabulator.test.js`, which verifies Tabulator table rendering and chat/news card flow.

## Running Tests

1. Install dependencies:
   ```sh
   cd frontend
   npm install
   ```
2. Run Playwright tests:
   ```sh
   npx playwright test
   ```

## Test Coverage
- The UI tests in `tabulator.test.js` use Playwright to verify Tabulator loading and chat/news card flow.
- If Tabulator or chat UI fails to load, check browser console for errors.

## Troubleshooting
- If the chat/Ask button displays `Grok: undefined` or you see empty prompts in the proxy logs, ensure your proxy/server is correctly passing the user's prompt to the xAI API. The outgoing payload to xAI should use the prompt from the incoming request body.
- The `/grok` endpoint now parses the xAI response, fetches news from NewsAPI, and returns both the explanation and news results to the frontend.
- Example fix for Node.js/Express:
  ```js
  messages: [
    { role: 'system', content: '...' },
    { role: 'user', content: req.body.prompt || '' }
  ]
  ```
- See migration notes in `README_MIGRATION.md`.

## Notes
- ag-Grid tests and references have been removed. See migration notes in `README_MIGRATION.md`.
