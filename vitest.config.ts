import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [
      '**/node_modules/**',
      '**/demo/**',
      '**/dist/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'demo/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
      ],
    },
    setupFiles: ['./tests/setup.ts'],
  },
})
