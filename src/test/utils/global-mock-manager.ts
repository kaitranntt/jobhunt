import { vi } from 'vitest'

// Type for auth method responses
type AuthMethodResponse = {
  data: unknown
  error: unknown
}

// Global mock state that persists across test runs
declare global {
  var __ensureMockConsistency: () => void
}

// Enhanced mock state isolation and cleanup
export const cleanupMockState = () => {
  try {
    // Clear global fetch mocks to prevent test interference
    if (typeof global !== 'undefined' && global.fetch && vi.isMockFunction(global.fetch)) {
      vi.unstubAllGlobals()
    }

    // Reset Supabase mocks if available
    if (typeof global !== 'undefined' && global.__resetMockSupabase) {
      global.__resetMockSupabase()
    }
  } catch (error) {
    console.warn('Failed to cleanup mock state:', error)
  }
}

// Enhanced consistency checker with comprehensive validation
export const ensureMockConsistency = () => {
  try {
    if (typeof global === 'undefined') {
      return
    }

    // Initialize global mock state if not present
    if (!global.__supabaseMockState) {
      global.__supabaseMockState = {
        persistentClient: null,
        isInitialized: false,
      }
    }

    const mockClient = global.__globalSupabaseMock
    if (!mockClient) {
      return
    }

    // Enhanced auth method validation with proper error handling
    const ensureAuthMethod = (methodName: string, defaultResponse: AuthMethodResponse) => {
      try {
        const authMethods = mockClient.auth as Record<string, unknown>
        const mockMethod = authMethods[methodName]
        if (!mockMethod || !vi.isMockFunction(mockMethod)) {
          authMethods[methodName] = vi.fn().mockResolvedValue(defaultResponse)
        } else {
          // Validate existing mock implementation
          const mockImpl = mockMethod.getMockImplementation()
          if (!mockImpl) {
            // Reset with proper implementation
            mockMethod.mockReset()
            mockMethod.mockResolvedValue(defaultResponse)
          }
        }
      } catch (error) {
        console.warn(`Failed to ensure auth method ${methodName}:`, error)
      }
    }

    // Ensure all critical auth methods with proper return types
    ensureAuthMethod('getUser', { data: { user: null }, error: null })
    ensureAuthMethod('signOut', { data: {}, error: null })
    ensureAuthMethod('getSession', { data: { session: null }, error: null })
    ensureAuthMethod('signUp', { data: { user: null, session: null }, error: null })
    ensureAuthMethod('signInWithPassword', { data: { user: null, session: null }, error: null })
    // Don't override updateUser, resetPasswordForEmail, and signInWithOAuth if they already have proper implementations
    // These are already set up with proper logic in the test database setup

    // Ensure onAuthStateChange with proper subscription handling
    try {
      if (
        !mockClient.auth.onAuthStateChange ||
        !vi.isMockFunction(mockClient.auth.onAuthStateChange)
      ) {
        mockClient.auth.onAuthStateChange = vi.fn(() => ({
          data: { subscription: { unsubscribe: vi.fn() } },
        }))
      }
    } catch (error) {
      console.warn('Failed to ensure onAuthStateChange:', error)
    }

    // Enhanced from method validation with comprehensive query builder
    try {
      if (!mockClient.from || !vi.isMockFunction(mockClient.from)) {
        mockClient.from = vi.fn().mockImplementation((_table: string) => {
          // Create enhanced query builder for reliable method chaining
          const queryBuilder = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            range: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnThis(),
            then: vi.fn().mockResolvedValue({ data: [], error: null }),
          }
          return queryBuilder
        })
      }
    } catch (error) {
      console.warn('Failed to ensure from method:', error)
    }
  } catch (error) {
    console.warn('Failed to ensure mock consistency:', error)
  }
}

// Test isolation helper for comprehensive cleanup
export const isolateTestMocks = () => {
  // Cleanup existing state
  cleanupMockState()

  // Ensure fresh mock state
  ensureMockConsistency()
}

// Store functions globally for access from test setup
if (typeof global !== 'undefined') {
  global.__ensureMockConsistency = ensureMockConsistency
  global.__isolateTestMocks = isolateTestMocks
  global.__cleanupMockState = cleanupMockState
}
