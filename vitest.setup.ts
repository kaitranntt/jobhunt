import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Import Supabase mocks to set them up globally
import './src/test/mocks/supabase'

// Import mock storage to ensure testStorage is available
import './src/test/utils/mock-storage'

// Import and setup global test utilities
import { setupGlobalTestUtils } from './src/test/utils/global-test-utils'

// Setup global test utilities for integration, e2e, and performance tests
setupGlobalTestUtils()

// Mock ResizeObserver globally for all tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserver

// Mock URL constructor for JSDOM compatibility
if (typeof global.URL === 'undefined') {
  global.URL = class URL {
    constructor(url: string, _base?: string) {
      this.href = url
      this.origin = 'https://test.supabase.co'
      this.protocol = 'https:'
      this.host = 'test.supabase.co'
      this.hostname = 'test.supabase.co'
      this.port = ''
      this.pathname = '/'
      this.search = ''
      this.hash = ''
    }
    href: string
    origin: string
    protocol: string
    host: string
    hostname: string
    port: string
    pathname: string
    search: string
    hash: string
    toString() {
      return this.href
    }
  } as any
}

expect.extend(matchers)

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.className = ''
  // Don't clear all mocks as it breaks the mock database implementations
  // vi.clearAllMocks()
})
