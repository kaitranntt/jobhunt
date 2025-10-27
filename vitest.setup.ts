import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Import Supabase mocks to set them up globally
import './src/test/mocks/supabase'

// Mock Logo.dev API key to prevent environment warnings
process.env.NEXT_PUBLIC_LOGO_DEV_KEY = 'test-logo-dev-api-key'

// Mock ResizeObserver globally for all tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver

expect.extend(matchers)

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.className = ''
  vi.clearAllMocks()
})
