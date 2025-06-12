# TODO: News Aggregator (2025-06-10)

## Card Creation & Chat
- [x] Ensure every chat search creates a new, distinct card (never merges into an existing one).
- [x] Fix: Sometimes cards are not created for certain queries (e.g. 'cats').
- [x] Add proper debug logging system for card creation events.
- [ ] Add a persistent event log or UI for card creation/debugging (not just console logs).
- [x] Prevent duplicate cards by ensuring proper ID generation.
- [x] Improve error feedback in chat when card creation fails or is a duplicate.

## UI/UX
- [x] Fix pagination controls being cut off at the bottom of cards/tables.
- [x] Make the distinction between cards/tables visually clearer in the UI.
- [ ] Add a visible log/debug panel for user actions and card creation events.
- [ ] Add keyboard shortcuts for common actions.
- [ ] Implement drag-and-drop functionality for card rearrangement.

## Tabulator / Data Handling
- [x] Fix Luxon dependency issues with Tabulator datetime formatting
- [x] Ensure compatibility between CDN and npm package versions
- [x] Add fallback mechanisms for date formatting
- [ ] Add comprehensive tests for date formatting edge cases
- [ ] Consider migrating completely from CDN to local imports for better reliability

## Code Quality & Performance
- [x] Refactor application to use modular architecture
- [x] Implement centralized state management
- [x] Add client and server-side caching for API calls
- [x] Optimize news fetching with pagination and proper error handling
- [ ] Add unit tests for new modules (state.js, api.js, ui.js, utils.js)
- [ ] Implement end-to-end tests for the refactored application
- [ ] Consider adding TypeScript for better type safety

## Future Features
- [ ] Add offline mode using IndexedDB
- [ ] Implement user preferences for default news sources
- [ ] Add data visualization options (charts, graphs)
- [ ] Support for multiple news API providers as fallbacks

## General
- [ ] Add more robust tests for card creation, merging, and error cases.
- [ ] Review and refactor card creation logic for clarity and maintainability.
- [ ] Document all known issues and debugging tips in README and BUGLOG.
