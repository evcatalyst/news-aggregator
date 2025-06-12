# Development Guide

## Local Setup

### Prerequisites

```bash
# Check Node.js version (18+ required)
node --version

# Check npm version
npm --version

# Check Docker version
docker --version
```

### Initial Setup

```bash
# Clone repository
git clone https://github.com/yourusername/news-aggregator.git
cd news-aggregator

# Install dependencies
npm install

# Copy environment configuration
cp proxy/.env.example proxy/.env

# Configure API keys in proxy/.env
nano proxy/.env
```

### Development Environment

```bash
# Start development stack
cd proxy && ./rebuild_stack.sh

# Access points:
# - Frontend: http://localhost:8080
# - API: http://localhost:3000
# - Health: http://localhost:3000/health
```

## Project Structure

```plaintext
news-aggregator/
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── utils/         # Utility functions
│   │   └── styles/        # CSS modules
│   └── public/            # Static assets
├── proxy/
│   ├── src/              # Server code
│   └── tests/            # Server tests
└── docs/                 # Documentation
```

## Development Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Run Tests**
   ```bash
   npm test
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## Code Style

- Use ESLint configuration
- Follow Prettier formatting
- Use TypeScript types
- Write JSDoc comments

## Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- CardCreation.test.js

# Run with coverage
npm run test:coverage
```

## Debugging

1. **Client-Side**
   - Use React DevTools
   - Check browser console
   - Enable debug logging

2. **Server-Side**
   - Use Node.js debugger
   - Check server logs
   - Monitor API responses

## Common Tasks

### Adding a Component

1. Create component file
2. Write component code
3. Add tests
4. Update documentation

### Modifying API

1. Update API endpoint
2. Update documentation
3. Add tests
4. Update client code

## Best Practices

1. **Code Quality**
   - Write clean, documented code
   - Follow project style guide
   - Add appropriate tests

2. **Git Workflow**
   - Write clear commit messages
   - Keep PRs focused
   - Update documentation

3. **Testing**
   - Write unit tests
   - Add integration tests
   - Test edge cases

## Troubleshooting

### Common Issues

1. **Build Errors**
   ```bash
   # Clear dependencies
   rm -rf node_modules
   npm install
   ```

2. **API Issues**
   - Check API keys
   - Verify proxy settings
   - Check rate limits

3. **Test Failures**
   - Update test snapshots
   - Check test environment
   - Verify mock data

## Resources

- [API Documentation](/api/overview)
- [Deployment Guide](/deploy/production)
- [Component Library](/guide/components)
- [GitHub Issues](https://github.com/yourusername/news-aggregator/issues)
