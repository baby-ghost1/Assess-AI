export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {},
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: ['src/modules/**/*.js', '!src/modules/**/index.js'],
  coverageThreshold: {
    global: { branches: 30, functions: 30, lines: 30, statements: 30 },
  },
}
