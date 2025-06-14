# News Aggregator Modernization (2025)

## Overview
This branch (`modernize-2025`) contains a modern rebuild of the News Aggregator application. The old implementation is preserved in the `frontend/` directory while the new implementation lives in `frontend-modern/`.

## Key Changes

### Architecture
- React 20+ with Server Components
- Next.js 14+ for improved SSR and streaming
- Modern state management with Server Actions and Jotai
- CSS Grid + Container Queries for responsive layouts
- TypeScript throughout

### Directory Structure
```
frontend-modern/
├── src/
│   ├── app/            # Next.js app router pages
│   ├── components/     # Reusable React components
│   ├── features/       # Feature-specific components and logic
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utilities and shared code
│   ├── styles/        # Global styles and CSS modules
│   └── types/         # TypeScript type definitions
└── public/            # Static assets
```

## Migration Strategy
1. Build new features in frontend-modern
2. Run both implementations in parallel
3. Test and validate new implementation
4. Switch over once feature parity is achieved

## Development

### Getting Started
```bash
cd frontend-modern
npm install
npm run dev
```

### Testing
```bash
npm test          # Run unit tests
npm run e2e      # Run E2E tests
npm run tsc      # Type checking
```

## Original Implementation
The original implementation remains in the `frontend/` directory and continues to work as before. This allows for:
- Easy comparison between implementations
- Gradual migration of features
- Risk-free experimentation with new approaches

## Comparison with Original
- Simplified state management
- Better type safety
- Improved performance
- Modern browser features
- Reduced bundle size
- Better developer experience
