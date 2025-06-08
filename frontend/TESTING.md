# Automated UI Testing for ag-Grid and Chat/News Card Flow

## Running UI Tests Locally

1. Install dependencies:
   
   cd frontend
   npm install
   npx playwright install

2. Start the frontend server (in one terminal):
   
   npm run dev

3. In another terminal, run the UI tests:
   
   npm test

---

## About the Tests
- The UI tests in `agGridLoad.test.js` use Playwright to verify ag-Grid loading and chat/news card flow.
- Ensure the frontend is running at http://localhost:8080 before running tests.

## CI Integration
- For CI, add a step to install dependencies, start the frontend server, and run `npm test`.
- See Playwright docs for advanced CI setup: https://playwright.dev/docs/ci

---

## Troubleshooting
- If ag-Grid or chat UI fails to load, check browser console for errors.
- Ensure all dependencies are installed and the server is running.
