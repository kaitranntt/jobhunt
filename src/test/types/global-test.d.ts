/**
 * Global test type declarations
 * Provides proper types for test utilities attached to global scope
 */

import type { RealtimeTestHarness } from '../utils/realtime-test-utils'
import type { MockSupabaseClient as MockSupabaseClientType } from '../utils/test-utils.types'

interface TestStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
}

declare global {
  // Test simulation flags
  var _simulateNetworkError: boolean | undefined

  // Global test mocks
  var __globalSupabaseMock: MockSupabaseClientType | undefined

  // Test utilities
  var testStorage: TestStorage | undefined
  var testRealtimeHarness: RealtimeTestHarness

  // Test lifecycle functions
  var __isolateTestMocks: (() => void) | undefined
  var __cleanupMockState: (() => void) | undefined
}

export {}
