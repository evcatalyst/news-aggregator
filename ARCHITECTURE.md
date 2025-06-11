# Architecture Notes: News Aggregator

## Card Creation & Chat Integration
- The chat sidebar (`ChatSidebar.jsx`) is responsible for handling user queries and creating new news cards.
- Cards are objects with an `articles` array; each card should be rendered as a separate table/card in the UI.
- Card creation is coordinated between React state and a vanilla JS state (`window.AppState.searchResults`).
- Debug logging is now present in `ChatSidebar.jsx` to help trace card creation attempts/results.

## Tabulator Integration
- Tabulator tables are used for rendering news articles in both card view and paginated table view
- Tabulator requires Luxon for advanced date/time formatting
- Luxon integration occurs in several places:
  - Import in `app.js` and global exposure via `window.luxon` and `window.DateTime`
  - Custom formatter in `tabulator-init.js` to provide robust date formatting
  - CDN links in `index.html` for both Tabulator (v6.3.0) and Luxon
- Fallback mechanisms in place for date formatting: Luxon → Native Date → Empty string

## Known Issues (2025-06-11)
- Sometimes new cards are not created for certain queries, or all new searches are added to the same table/card.
- There is no clear local log of card creation events (now improved with debug logs).
- See `BUGLOG.md` for more details.

## Next Steps
- Refactor card creation and rendering logic to ensure each search always creates a new, distinct card.
- Improve UI feedback and error handling for failed/duplicate card creation.
- Add a persistent event log or UI for debugging card creation events.
