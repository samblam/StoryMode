/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts?$': 'esbuild-jest',
  },
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  setupFiles: ['./jest.setup.ts'],
};

module.exports = config;