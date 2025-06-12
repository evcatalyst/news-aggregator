# Bug Log: News Aggregator

## 2025-06-11

### Card Creation and Article Grouping
- Issue: Initial news load created individual cards for each article
- Resolution: Implemented proper article grouping
- Changes:
  - Modified initial data processing to group articles into a single "Latest News" card
  - Updated state management to handle grouped articles
  - Enhanced NewsCard component for better multi-article display
  - Added robust error handling for article properties

### Tabulator Integration
- Issue: Tabulator dependency conflicts causing date formatting issues
- Resolution: Standardized date handling across application
- Changes:
  - Updated Tabulator to v6.3.0
  - Implemented consistent DateTime handling
  - Added fallback formatting for invalid dates
  - Enhanced error logging for date-related issues

### Tabulator Date Formatting Issues
- ✅ FIXED: All date formatting is now handled natively in JavaScript. No more Luxon dependency errors.
- If you see date issues, check the `formatDateSafe` utility and ensure you are running the latest code.

## 2025-06-10

### Card Creation/Chat Integration
- ✅ FIXED: New searches (e.g. 'cats') now properly create new cards for all queries.
- ✅ FIXED: Comprehensive logging system added across all modules via state.js and utils.js.
- Solution:
  - Refactored app architecture with centralized state management
  - Ensured card ID generation is properly handled for all queries
  - Added explicit card creation logic in handleAskGrok() function
  - Improved keyword extraction in server-side processing

### UI/UX
- ✅ FIXED: Pagination controls now have proper spacing in card layouts.
- ✅ FIXED: Cards now have consistent styling and clear separation.
- Solution:
  - Added proper margin and padding in card rendering
  - Implemented IntersectionObserver for dynamic spacing adjustment
  - Moved UI logic to dedicated ui.js module for better maintenance

### Data Consistency
- ✅ FIXED: Cards are now created for all queries, even when the news API returns no results.
- ✅ FIXED: Server-side caching improves consistency and reduces duplicate API calls.
- Solution:
  - Added fallback mechanisms for empty result sets
  - Implemented both client and server-side caching
  - Added robust error handling with informative messages
  - Modified the server.js endpoint to always provide usable responses

---

## Steps to Reproduce
1. Use the chat to search for 'dogs' (card is created).
2. Search for 'cats' (card may not be created, or is added to the same table).
3. Try other topics and observe if new cards are created or if they are merged.

---

## Debugging Aids
- Console debug logs are now present in `ChatSidebar.jsx` for all card creation attempts/results.
- Review browser console for `[ChatSidebar]` logs when testing card creation.

---

## See also: README.md, ARCHITECTURE.md for more context.
