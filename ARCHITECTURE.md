# Architecture Notes: News Aggregator

## Card Creation & Chat Integration
- The chat sidebar (`ChatSidebar.jsx`) is responsible for handling user queries and creating new news cards.
- Cards are objects with an `articles` array; each card should be rendered as a separate table/card in the UI.
- Card creation is coordinated between React state and a vanilla JS state (`window.AppState.searchResults`).
- Debug logging is now present in `ChatSidebar.jsx` to help trace card creation attempts/results.

## Known Issues (2025-06-10)
- Sometimes new cards are not created for certain queries, or all new searches are added to the same table/card.
- There is no clear local log of card creation events (now improved with debug logs).
- See `BUGLOG.md` for more details.

## Next Steps
- Refactor card creation and rendering logic to ensure each search always creates a new, distinct card.
- Improve UI feedback and error handling for failed/duplicate card creation.
- Add a persistent event log or UI for debugging card creation events.
