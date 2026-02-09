import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@ccms': path.resolve(__dirname, './projects/shared/src/lib'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./projects/shared/src/test-setup.ts'],
    include: ['projects/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        // Fail CI if coverage drops below these thresholds
        // Current coverage (Jan 2026): statements 67%, branches 53%, functions 58%, lines 67%
        statements: 62,
        branches: 48,
        functions: 53,
        lines: 62,
      },
    },
  },
});
