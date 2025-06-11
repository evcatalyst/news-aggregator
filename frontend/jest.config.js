module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  // Run only unit and integration tests, not e2e tests
  testMatch: [
    '**/__tests__/unit/**/*.[jt]s?(x)',
    '**/__tests__/integration/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverage: true,
  coverageReporters: ['text', 'lcov'],
  coverageDirectory: 'coverage',
  // Explicitly exclude e2e test directory and Playwright tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/src/__tests__/e2e/',
    'tabulator.test.js'
  ]
};
