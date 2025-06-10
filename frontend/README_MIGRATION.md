# MIGRATION: ag-Grid → Tabulator

As of June 2025, the project has migrated from ag-Grid to Tabulator for all news table rendering. All ag-Grid code, tests, and documentation have been removed or updated. See `tabulator-demo.html` and `tabulator.test.js` for the new integration and test coverage.

- Canonical app entry point: `app.js`
- Obsolete/archived: `app_enhanced.js.ARCHIVED`
- All ag-Grid references are removed from code and docs.
- The `/grok` endpoint now:
  - Receives a user prompt from the frontend
  - Sends it to xAI Grok and parses the structured JSON response
  - Fetches news from NewsAPI using the generated query
  - Returns the explanation, query, and news results to the frontend

For details, see `README.md` and `TESTING.md`.
