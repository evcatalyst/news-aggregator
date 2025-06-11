# TODO: News Aggregator (2025-06-11)

## Card Creation & Chat
- [ ] Ensure every chat search creates a new, distinct card (never merges into an existing one).
- [ ] Fix: Sometimes cards are not created for certain queries (e.g. 'cats').
- [ ] Add a persistent event log or UI for card creation/debugging (not just console logs).
- [ ] Prevent duplicate cards for similar/identical queries.
- [ ] Improve error feedback in chat when card creation fails or is a duplicate.

## UI/UX
- [ ] Fix pagination controls being cut off at the bottom of cards/tables.
- [ ] Make the distinction between cards/tables visually clearer in the UI.
- [ ] Add a visible log/debug panel for user actions and card creation events.

## Tabulator / Data Handling
- [x] Fix Luxon dependency issues with Tabulator datetime formatting
- [x] Ensure compatibility between CDN and npm package versions
- [x] Add fallback mechanisms for date formatting
- [ ] Add comprehensive tests for date formatting edge cases
- [ ] Consider migrating completely from CDN to local imports for better reliability

## General
- [ ] Add more robust tests for card creation, merging, and error cases.
- [ ] Review and refactor card creation logic for clarity and maintainability.
- [ ] Document all known issues and debugging tips in README and BUGLOG.
