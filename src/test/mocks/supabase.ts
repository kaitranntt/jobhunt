import { vi, type MockedFunction } from 'vitest'

// Extended mock fetch type with custom test properties
interface MockFetchFunction extends MockedFunction<typeof fetch> {
  _isMockingNetworkError?: boolean
}

// Mock type definitions
interface _MockQueryResult<T = unknown> {
  data: T | T[] | null
  error: { code: string; message: string } | null
}

interface MockQueryBuilder {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  in: ReturnType<typeof vi.fn>
  gte: ReturnType<typeof vi.fn>
  lte: ReturnType<typeof vi.fn>
  ilike: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
  __setQueryData: (data: unknown[]) => MockQueryBuilder
  __setQueryError: (error: unknown) => MockQueryBuilder
  __reset: () => MockQueryBuilder
}

// Interface definitions for Supabase auth operations
interface SignUpData {
  email?: string
  password?: string
  options?: {
    data?: {
      name?: string
      avatar_url?: string | null
      bio?: string
    }
  }
}

interface SignInData {
  email: string
  password: string
}

interface UpdateUserData {
  data?: {
    name?: string
    avatar_url?: string | null
    bio?: string
  }
  email?: string
}

interface ResetPasswordOptions {
  redirectTo?: string
}

interface SignInOAuthData {
  provider: string
  options?: {
    redirectTo?: string
  }
}

interface MockSupabaseClient {
  from: ReturnType<typeof vi.fn>
  auth: {
    getUser: ReturnType<typeof vi.fn>
    onAuthStateChange: ReturnType<typeof vi.fn>
    signUp: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    updateUser: ReturnType<typeof vi.fn>
    resetPasswordForEmail: ReturnType<typeof vi.fn>
    signInWithOAuth: ReturnType<typeof vi.fn>
    getSession: ReturnType<typeof vi.fn>
  }
  storage: {
    from: ReturnType<typeof vi.fn>
  }
}

// Mock Supabase client globally for all tests
const createMockSupabaseClient = (): MockSupabaseClient => {
  const createMockQueryBuilder = (): MockQueryBuilder => {
    const queryData: unknown[] = []
    let queryError: unknown = null
    let isSingle = false

    const ensureValidBuilder = () => {
      // Ensure all methods return the builder even after mock clearing
      builder.select.mockImplementation(() => builder)
      builder.insert.mockImplementation(() => builder)
      builder.update.mockImplementation(() => builder)
      builder.delete.mockImplementation(() => builder)
      builder.eq.mockImplementation(() => builder)
      builder.order.mockImplementation(() => builder)
      builder.in.mockImplementation(() => builder)
      builder.gte.mockImplementation(() => builder)
      builder.lte.mockImplementation(() => builder)
      builder.ilike.mockImplementation(() => builder)
      builder.or.mockImplementation(() => builder)
      builder.range.mockImplementation(() => builder)
      builder.single.mockImplementation(() => {
        isSingle = true
        return builder
      })
      builder.then.mockImplementation((resolve, reject) => {
        if (queryError) {
          if (reject) reject(queryError)
          return Promise.reject(queryError)
        }
        const result = isSingle
          ? queryData.length > 0
            ? { data: queryData[0], error: null }
            : { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
          : { data: queryData, error: null }
        if (resolve) resolve(result)
        return Promise.resolve(result)
      })
      return builder
    }

    const builder = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => builder),
      in: vi.fn(() => builder),
      gte: vi.fn(() => builder),
      lte: vi.fn(() => builder),
      ilike: vi.fn(() => builder),
      or: vi.fn(() => builder),
      range: vi.fn(() => builder),
      single: vi.fn(() => {
        isSingle = true
        return builder
      }),
      then: vi.fn((resolve, reject) => {
        if (queryError) {
          if (reject) reject(queryError)
          return Promise.reject(queryError)
        }
        const result = isSingle
          ? queryData.length > 0
            ? { data: queryData[0], error: null }
            : { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
          : { data: queryData, error: null }
        if (resolve) resolve(result)
        return Promise.resolve(result)
      }),

      // Helper methods for testing
      __setQueryData: (data: unknown[]) => {
        queryData.length = 0
        queryData.push(...data)
        return builder
      },
      __setQueryError: (error: unknown) => {
        queryError = error
        return builder
      },
      __reset: () => {
        queryData.length = 0
        queryError = null
        isSingle = false
        return builder
      },
      __ensureValid: ensureValidBuilder,
    }

    return ensureValidBuilder()
  }

  // Create mock data storage for tables
  const _mockData = {
    user_profiles: new Map(),
    applications: new Map(),
    companies: new Map(),
    application_activities: new Map(),
  }

  const mockFrom = vi.fn((table: string) => {
    const queryBuilder = createMockQueryBuilder()

    // Pre-populate with test data for specific tables
    if (table === 'user_profiles') {
      const mockProfiles = [
        {
          id: 'mock-user-middleware@example.com',
          user_id: 'mock-user-middleware@example.com',
          email: 'middleware@example.com',
          name: 'Middleware User',
          avatar_url: null,
          bio: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]
      queryBuilder.__setQueryData(mockProfiles)
    }

    return queryBuilder
  })

  return {
    from: mockFrom,
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user', email: 'test@example.com' } },
        error: null,
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn().mockResolvedValue({ data: {}, error: null }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: 'mock-token', user: { id: 'test-user' } } },
        error: null,
      }),
      signUp: vi.fn().mockImplementation((userData: SignUpData) => {
        const { email, options } = userData || {}

        // Check if global fetch is mocked to simulate network errors
        if (global.fetch && vi.isMockFunction(global.fetch)) {
          const mockFetch = global.fetch as MockFetchFunction
          if (mockFetch.getMockImplementation()) {
            const implementation = mockFetch.getMockImplementation()
            if (implementation && typeof implementation === 'function') {
              try {
                const result = implementation('', {})
                if (result instanceof Promise) {
                  return result.then(() => {
                    return Promise.reject(new Error('Network error'))
                  })
                }
              } catch (_error) {
                return Promise.reject(new Error('Network error'))
              }
            }
          }
        }

        // Handle various test scenarios
        if (!email) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('Email is required'),
          })
        }

        // Check for duplicate email scenarios
        if (email === 'existing@example.com' || email === 'duplicate@example.com') {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('user_already_exists'),
          })
        }

        // Validate email format
        if (email === 'invalid-email') {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('invalid_email'),
          })
        }

        const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`
        const user = {
          id: userId,
          email,
          user_metadata: options?.data || { name: 'Test User', avatar_url: null, bio: 'Test bio' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_verified: true,
        }
        const session = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          user,
        }
        return Promise.resolve({ data: { user, session }, error: null })
      }),
      signInWithPassword: vi.fn().mockImplementation(({ email, password }: SignInData) => {
        // Check if global fetch is mocked to simulate network errors
        if (global.fetch && vi.isMockFunction(global.fetch)) {
          const mockFetch = global.fetch as MockFetchFunction
          if (mockFetch.getMockImplementation()) {
            const implementation = mockFetch.getMockImplementation()
            if (implementation && typeof implementation === 'function') {
              try {
                const result = implementation('', {})
                if (result instanceof Promise) {
                  return result.then(() => {
                    return Promise.reject(new Error('Network error'))
                  })
                }
              } catch (_error) {
                return Promise.reject(new Error('Network error'))
              }
            }
          }
        }

        // Support multiple test credentials from the integration tests
        const validCredentials = [
          { email: 'test@example.com', password: 'test-password' },
          { email: 'loginuser@example.com', password: 'LoginPassword123!' },
          { email: 'concurrent@example.com', password: 'ConcurrentPassword123!' },
          { email: 'profileuser@example.com', password: 'ProfilePassword123!' },
          { email: 'resetuser@example.com', password: 'OriginalPassword123!' },
          { email: 'securityuser@example.com', password: 'SecurityPassword123!' },
          { email: 'timeout@example.com', password: 'TimeoutPassword123!' },
          { email: 'middleware@example.com', password: 'MiddlewarePassword123!' },
        ]

        const isValidCredential = validCredentials.some(
          c => c.email === email && c.password === password
        )

        if (isValidCredential) {
          const user = {
            id: `mock-user-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
            email,
            user_metadata: { name: 'Test User', avatar_url: null, bio: 'Test bio' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_verified: true,
          }
          const session = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user,
          }
          return Promise.resolve({ data: { user, session }, error: null })
        }
        return Promise.resolve({
          data: { user: null, session: null },
          error: new Error('Invalid login credentials'),
        })
      }),
      updateUser: vi.fn().mockImplementation((params: UpdateUserData) => {
        // Input validation
        if (!params || typeof params !== 'object') {
          return Promise.resolve({
            data: { user: null },
            error: new Error('Update parameters are required'),
          })
        }

        // Check for network error simulation
        if (global.fetch && vi.isMockFunction(global.fetch)) {
          const mockFetch = global.fetch as MockFetchFunction
          if (mockFetch.getMockImplementation()) {
            const implementation = mockFetch.getMockImplementation()
            if (implementation && typeof implementation === 'function') {
              try {
                const result = implementation('', {})
                if (result instanceof Promise) {
                  return result.then(() => {
                    return Promise.reject(new Error('Network error'))
                  })
                }
              } catch (_error) {
                return Promise.reject(new Error('Network error'))
              }
            }
          }
        }

        try {
          const data = params?.data || {}
          const updatedUser = {
            id: 'test-user',
            email: params?.email || 'updated@example.com',
            user_metadata: data || { name: 'Updated User', avatar_url: null, bio: 'Updated bio' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_verified: true,
          }

          return Promise.resolve({
            data: { user: updatedUser },
            error: null,
          })
        } catch (_error) {
          return Promise.resolve({
            data: { user: null },
            error: new Error('User update failed'),
          })
        }
      }),
      resetPasswordForEmail: vi
        .fn()
        .mockImplementation((email: string, _options?: ResetPasswordOptions) => {
          // Input validation
          if (!email || typeof email !== 'string') {
            return Promise.resolve({
              data: {},
              error: new Error('Email is required'),
            })
          }

          // Validate email format
          if (!email.includes('@') || !email.includes('.')) {
            return Promise.resolve({
              data: {},
              error: new Error('Invalid email format'),
            })
          }

          // Check for network error simulation
          if (global.fetch && vi.isMockFunction(global.fetch)) {
            const mockFetch = global.fetch as MockFetchFunction
            if (mockFetch.getMockImplementation()) {
              const implementation = mockFetch.getMockImplementation()
              if (implementation && typeof implementation === 'function') {
                try {
                  const result = implementation('', {})
                  if (result instanceof Promise) {
                    return result.then(() => {
                      return Promise.reject(new Error('Network error'))
                    })
                  }
                } catch (_error) {
                  return Promise.reject(new Error('Network error'))
                }
              }
            }
          }

          // Simulate specific test cases
          if (email === 'nonexistent@example.com') {
            return Promise.resolve({
              data: {},
              error: new Error('User not found'),
            })
          }

          try {
            // Mock successful password reset request
            return Promise.resolve({
              data: {},
              error: null,
            })
          } catch (_error) {
            return Promise.resolve({
              data: {},
              error: new Error('Password reset request failed'),
            })
          }
        }),
      signInWithOAuth: vi.fn().mockImplementation(({ provider, options }: SignInOAuthData) => {
        // Input validation
        if (!provider || typeof provider !== 'string') {
          return Promise.resolve({
            data: { url: null },
            error: new Error('OAuth provider is required'),
          })
        }

        // Check for network error simulation
        if (global.fetch && vi.isMockFunction(global.fetch)) {
          const mockFetch = global.fetch as MockFetchFunction
          if (mockFetch.getMockImplementation()) {
            const implementation = mockFetch.getMockImplementation()
            if (implementation && typeof implementation === 'function') {
              try {
                const result = implementation('', {})
                if (result instanceof Promise) {
                  return result.then(() => {
                    return Promise.reject(new Error('Network error'))
                  })
                }
              } catch (_error) {
                return Promise.reject(new Error('Network error'))
              }
            }
          }
        }

        try {
          if (provider === 'github') {
            const url = 'https://github.com/login/oauth/authorize'
            if (options?.redirectTo) {
              return Promise.resolve({
                data: { url: `${url}?redirect_uri=${encodeURIComponent(options.redirectTo)}` },
                error: null,
              })
            }
            return Promise.resolve({
              data: { url },
              error: null,
            })
          }
          // For invalid providers, return an error
          if (provider === 'invalid-provider') {
            return Promise.resolve({
              data: { url: null },
              error: new Error('Invalid OAuth provider'),
            })
          }
          // Default OAuth provider response
          return Promise.resolve({
            data: { url: 'https://oauth.example.com' },
            error: null,
          })
        } catch (_error) {
          return Promise.resolve({
            data: { url: null },
            error: new Error('OAuth sign in failed'),
          })
        }
      }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(() => ({})),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: '' } }),
      })),
    },
  }
}

// Create a persistent mock client instance
// Note: This variable is kept for backward compatibility but now uses enhanced state manager
let _persistentMockClient: MockSupabaseClient | null = null

const getOrCreateMockClient = (): MockSupabaseClient => {
  return getOrCreatePersistentClient()
}

// Mock the createClient function
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => getOrCreateMockClient()),
}))

// Mock the server createClient function
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => getOrCreateMockClient()),
}))

// Global access to mocks for test setup
declare global {
  var __mockSupabaseQueryBuilders: Map<string, MockQueryBuilder>
  var __setupMockSupabaseData: (table: string, data: unknown[]) => void
  var __setupMockSupabaseError: (table: string, error: unknown) => void
  var __resetMockSupabase: () => void
  var __globalSupabaseMock: MockSupabaseClient | undefined
  var __ensureMockConsistency: () => void
  var __supabaseMockState: {
    persistentClient: MockSupabaseClient | null
    isInitialized: boolean
  }
}

// Initialize global mock state with proper structure
if (typeof global !== 'undefined') {
  global.__mockSupabaseQueryBuilders = global.__mockSupabaseQueryBuilders || new Map()
  global.__supabaseMockState = global.__supabaseMockState || {
    persistentClient: null,
    isInitialized: false,
  }
}

// Enhanced mock state manager
const getOrCreatePersistentClient = (): MockSupabaseClient => {
  if (!global.__supabaseMockState?.persistentClient) {
    const newClient = createMockSupabaseClient()
    global.__supabaseMockState!.persistentClient = newClient
    global.__globalSupabaseMock = newClient
  }
  return global.__supabaseMockState!.persistentClient
}

// Global setup functions with improved error handling
global.__setupMockSupabaseData = (table: string, data: unknown[]) => {
  try {
    const mockClient = getOrCreatePersistentClient()
    const queryBuilder = mockClient.from(table) as MockQueryBuilder
    if (queryBuilder && typeof queryBuilder.__setQueryData === 'function') {
      queryBuilder.__setQueryData(data)
      global.__mockSupabaseQueryBuilders.set(table, queryBuilder)
    }
  } catch (error) {
    console.warn(`Failed to setup mock data for table ${table}:`, error)
  }
}

global.__setupMockSupabaseError = (table: string, error: unknown) => {
  try {
    const mockClient = getOrCreatePersistentClient()
    const queryBuilder = mockClient.from(table) as MockQueryBuilder
    if (queryBuilder && typeof queryBuilder.__setQueryError === 'function') {
      queryBuilder.__setQueryError(error)
      global.__mockSupabaseQueryBuilders.set(table, queryBuilder)
    }
  } catch (error) {
    console.warn(`Failed to setup mock error for table ${table}:`, error)
  }
}

global.__resetMockSupabase = () => {
  try {
    global.__mockSupabaseQueryBuilders?.clear()
    // Reset persistent client state if it exists
    if (global.__supabaseMockState?.persistentClient) {
      // Recreate fresh client to ensure clean state
      global.__supabaseMockState.persistentClient = createMockSupabaseClient()
      global.__globalSupabaseMock = global.__supabaseMockState.persistentClient
    }
  } catch (error) {
    console.warn('Failed to reset Supabase mocks:', error)
  }
}

export { createMockSupabaseClient }
