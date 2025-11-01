import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./vitest.performance.setup.ts'],
    env: {
      NODE_ENV: 'test',
      PERFORMANCE_TEST: 'true',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Performance tests need single thread for accurate measurements
        minThreads: 1,
        maxThreads: 1,
      },
    },
    hookTimeout: 120000,
    testTimeout: 60000,
    include: [
      'src/performance/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
      'src/benchmarks/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts}',
    ],
    exclude: [
      'node_modules/',
      'dist/',
      '.idea/',
      '.git/',
      '.cache/',
    ],
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './reports/performance-test-results.json',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@test': resolve(__dirname, './src/test'),
    },
  },
})