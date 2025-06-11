# Comprehensive Testing Strategy

This project implements a multi-layer testing approach to ensure reliability, with special focus on the card creation process that was previously problematic.

## Test Types

### Unit Tests (Jest)

Unit tests focus on individual components and functions in isolation:

- **Component Tests**: Test React components with React Testing Library
- **Utility Tests**: Test helper functions and API utilities

Run unit tests with:
```sh
cd frontend
npm run test:unit
```

### Integration Tests

Integration tests verify that components work together correctly:

- **Chat to Card Flow**: Test the process from chat input to card creation
- **API Integration**: Test interaction with backend services

Run integration tests with:
```sh
cd frontend
npm test
```

### End-to-End Tests (Playwright)

E2E tests simulate real user interactions through the browser:

- **Card Creation Tests**: Verify fix for the issue where new cards weren't being created properly
- **Pagination Tests**: Ensure pagination controls are fully visible and functional
- **General Flow Tests**: Test complete user journeys from chat to card visualization
- **Date Formatting Tests**: Verify Tabulator displays dates correctly with Luxon integration

Run E2E tests with:
```sh
cd frontend
npm run test:e2e
```

For visual validation during E2E tests:
```sh
cd frontend
npx percy exec -- npm run test:e2e
```

## Test Coverage

The tests specifically address the following known issues:

1. **Card Creation Issue**: Tests verify each search query creates a distinct card
2. **Pagination Visibility**: Tests confirm pagination controls aren't cut off
3. **Duplicate Prevention**: Tests ensure identical searches don't create duplicate cards

## Running All Tests

To run the complete test suite:

```sh
cd frontend
npm run test         # Run Jest tests
npm run test:e2e     # Run Playwright tests
```

## Test Directory Structure

```
src/
├── __tests__/
│   ├── e2e/                  # Playwright E2E tests (run in browser)
│   │   └── CardCreationIssue.test.js   # Tests for card creation bug fix
│   ├── integration/          # Integration tests (React components working together)
│   │   └── ChatToCardFlow.test.jsx     # Tests for chat to card creation flow
│   └── unit/                 # Unit tests for individual components
│       ├── App.test.jsx      # Tests for App component
│       ├── components/       # Tests for React components
│       └── utils/            # Tests for utility functions
└── ...
```

## Debugging Failed Tests

### Card Creation Tests

When card creation tests fail, check:

1. Open the test-results directory to view screenshots:
   - `card-creation-test.png`: Shows all cards after creation
   - `pagination-visibility.png`: Shows pagination controls visibility
   - `card-with-pagination.png`: Shows the full card with pagination

2. Check console logs for relevant messages:
   - `[ChatSidebar]` logs track chat and card creation attempts
   - `[App]` logs show card handling in App component
   - `[renderNewsCard]` logs show vanilla JS card rendering

3. Data attributes for easy debugging:
   - Each card has `data-card-id` attribute
   - Pagination controls can be inspected for visibility

## Advanced Testing Features

1. **Visual Testing**: Using Percy with Playwright for visual regression tests
2. **Console Log Capture**: Tests capture and analyze console logs for errors
3. **DOM State Analysis**: Tests verify DOM structure through card and element counts

## Known Issues & Test Coverage

- Tests specifically verify the fixes for the card creation issue where new searches would merge into existing cards
- Tests confirm pagination controls are fully visible with the increased card margin and height
- Tests validate proper separation of search results into distinct cards
