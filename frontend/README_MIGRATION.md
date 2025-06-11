# MIGRATION: ag-Grid → Tabulator

As of June 2025, the project has migrated from ag-Grid to Tabulator for all news table rendering. All ag-Grid code, tests, and documentation have been removed or updated. See `tabulator-demo.html` and `tabulator.test.js` for the new integration and test coverage.

## June 11, 2025 Update: Luxon Integration

Tabulator requires Luxon for date formatting functionality. We've implemented proper Luxon integration:

1. **Version Alignment**: Updated CDN version to 6.3.0 to match npm package
2. **Custom Formatters**: Added `luxonDatetime` custom formatter in `tabulator-init.js`
3. **Fallback Mechanisms**: Created `formatDateSafe()` utility function for robust date handling
4. **Global Exposure**: Properly exposed Luxon to global scope via multiple methods
5. **Initialization Module**: Added `tabulator-init.js` to ensure formatters are available

- Canonical app entry point: `app.js`
- Obsolete/archived: `app_enhanced.js.ARCHIVED`
- All ag-Grid references are removed from code and docs.
- The `/grok` endpoint now:
  - Receives a user prompt from the frontend
  - Sends it to xAI Grok and parses the structured JSON response
  - Fetches news from NewsAPI using the generated query
  - Returns the explanation, query, and news results to the frontend

For details, see `README.md` and `TESTING.md`.
