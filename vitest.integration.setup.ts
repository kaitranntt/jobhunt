import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Import test utilities
import { createMockTestDatabase, type TestDatabase } from './src/test/utils/test-database'
import { setupMockStorage } from './src/test/utils/mock-storage'
import {
  createPerformanceMonitor,
  type PerformanceMonitor,
} from './src/test/utils/performance-monitor'
import { setupTestRealtime } from './src/test/utils/realtime-test-utils'

// Global test state
let testDatabase: TestDatabase | null = null
let performanceMonitor: PerformanceMonitor | null = null

beforeAll(() => {
  console.log('🧪 Setting up integration test environment...')

  // Setup test database with mock implementation
  testDatabase = createMockTestDatabase()

  // Setup mock storage for file operations
  setupMockStorage()

  // Initialize performance monitor
  performanceMonitor = createPerformanceMonitor()

  // Setup realtime testing infrastructure
  setupTestRealtime()

  // Mock environment variables for testing
  process.env.NEXT_PUBLIC_SUPABASE_URL = testDatabase.supabaseUrl
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY = testDatabase.supabaseKey
  process.env.SUPABASE_SERVICE_ROLE_KEY = testDatabase.serviceRoleKey
  process.env.NEXT_PUBLIC_LOGO_DEV_KEY = 'test-logo-dev-api-key'

  // Set up integration test specific mocks
  vi.mock('next/navigation', () => ({
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '/',
  }))

  console.log('✅ Integration test environment ready')
})

beforeEach(async () => {
  // Reset database state before each test
  if (testDatabase) {
    await testDatabase.reset()
  }

  // Reset performance monitor
  if (performanceMonitor) {
    performanceMonitor.reset()
  }

  // Clear all mocks
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  document.documentElement.className = ''

  // Clear DOM
  document.body.innerHTML = ''
  document.head.innerHTML = ''
})

afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...')

  // Cleanup test database
  if (testDatabase) {
    await testDatabase.cleanup()
  }

  // Cleanup performance monitor
  if (performanceMonitor && typeof performanceMonitor.cleanup === 'function') {
    await performanceMonitor.cleanup()
  }

  console.log('✅ Integration test cleanup complete')
})

// Global test utilities
;(global as any).testUtils = {
  getTestDatabase: () => testDatabase!,
  getPerformanceMonitor: () => performanceMonitor,
  createTestUser: async (userData = {}) => {
    if (!testDatabase) throw new Error('Test database not initialized')
    return testDatabase.createUser(userData)
  },
  createTestApplication: async (userId: string, appData = {}) => {
    if (!testDatabase) throw new Error('Test database not initialized')
    return testDatabase.createApplication(userId, appData as any)
  },
  createTestCompany: async (companyData = {}) => {
    if (!testDatabase) throw new Error('Test database not initialized')
    return testDatabase.createCompany(companyData as any)
  },
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    return { result, duration }
  },
}
