import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // So we don't need to import describe, it, test, etc.
    environment: 'node', // Similar to Jest's testEnvironment
  },
});