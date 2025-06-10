# Bug Log: News Aggregator

## 2025-06-10

### Card Creation/Chat Integration
- Sometimes new searches (e.g. 'cats') do not create a new card, but the chat says it did. Other times, all new searches are added to the same table/card.
- There is no clear local log of card creation events, making debugging difficult.
- Debug logging has been added to `ChatSidebar.jsx` for card creation attempts/results.

### UI/UX
- Pagination controls at the bottom of the table can be cut off depending on card/table height.
- The distinction between cards/tables is not always clear in the UI.

### Data Consistency
- Sometimes cards are not created if the news API returns no results, but the chat may still say a card was created (now fixed, but needs more testing).
- Duplicate cards can be created if the same search is run multiple times with slightly different queries.

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
