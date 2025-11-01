import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts', './vitest.integration.setup.ts'],
    env: {
      NODE_ENV: 'test',
      INTEGRATION_TEST: 'true',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    hookTimeout: 60000,
    testTimeout: 30000,
    include: [
      'src/**/__tests__/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.idea/',
      '.git/',
      '.cache/',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        '.next/',
        'out/',
        '**/coverage/**',
        '.yarn/**',
        '**/*.config.*',
        '**/vitest.setup.ts',
        '**/vitest.integration.setup.ts',
        '**/*.d.ts',
        '**/src/lib/types/**',
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/src/lib/supabase/client.ts',
        '**/src/lib/supabase/server.ts',
        '**/src/lib/supabase/middleware.ts',
        '**/src/middleware.ts',
        '**/src/app/layout.tsx',
        '**/src/app/**/route.ts',
        '**/src/app/page.tsx',
        '**/src/app/dashboard/page.tsx',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 75,
        statements: 85,
      },
      all: true,
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './src/test'),
    },
  },
})