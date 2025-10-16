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
    setupFiles: './vitest.setup.ts',
    env: {
      NODE_ENV: 'test',
    },
    include: [
      'src/**/__tests__/**/*.{ts,tsx}',
      'src/**/*.{test,spec}.{ts,tsx}',
      'tests/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'tests/e2e/**', // Exclude E2E tests from Vitest
      '.next/**',
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.yarn/**',
      '**/*.config.*',
      '**/vitest.setup.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        // Build & Dependencies
        'node_modules/**',
        '.next/**',
        'out/**',
        'dist/**',
        'build/**',
        '**/coverage/**',

        // Yarn SDK files (not our code)
        '.yarn/**',

        // Config files
        '**/*.config.*',
        '**/vitest.setup.ts',

        // Type definitions (no runtime behavior)
        '**/*.d.ts',
        '**/src/lib/types/**',

        // Test files
        '**/__tests__/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',

        // Thin library wrappers (no business logic)
        '**/src/lib/supabase/client.ts',
        '**/src/lib/supabase/server.ts',
        '**/src/lib/supabase/middleware.ts',

        // Next.js framework patterns (no business logic)
        '**/src/middleware.ts',
        '**/src/app/layout.tsx',
        '**/src/app/**/route.ts',

        // Pure presentational pages (no business logic)
        '**/src/app/page.tsx',
        '**/src/app/dashboard/page.tsx',

        // E2E tests (run by Playwright)
        'tests/e2e/**',
        'tests/e2e/**/*',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
