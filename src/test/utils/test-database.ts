import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { vi, type MockedFunction } from 'vitest'

// Extended mock fetch type with custom test properties
interface MockFetchFunction extends MockedFunction<typeof fetch> {
  _isMockingNetworkError?: boolean
}

import type {
  TestUser,
  TestApplication,
  TestCompany,
} from '@/integration/__tests__/types/integration-test.types'
import type {
  StrictTestDatabase,
  MockSupabaseClient,
  MockUser,
  MockSession,
  MockAuthUser,
  MockDatabaseRecord,
  MockApplicationRecord,
  MockCompanyRecord,
  MockJobRecord,
  MockQueryValue,
  MockDataStorage,
} from './test-utils.types'

// Interface definitions for auth data
interface UserMetadata {
  name: string
  avatar_url?: string | null
  bio?: string
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

export interface TestDatabase extends StrictTestDatabase {
  supabase: SupabaseClient | MockSupabaseClient
  createApplication: (
    userId: string,
    appData?: Partial<MockApplicationRecord>
  ) => Promise<TestApplication>
  createCompany: (companyData?: Partial<MockCompanyRecord>) => Promise<TestCompany>
  createJob: (jobData?: Partial<MockJobRecord>) => Promise<MockJobRecord>
}

export async function createTestDatabase(): Promise<TestDatabase> {
  // Use environment variables or defaults for test database
  const supabaseUrl = process.env.TEST_SUPABASE_URL || 'https://test.supabase.co'
  const supabaseKey = process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key'
  const serviceRoleKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key'

  // Create Supabase client with service role for admin operations
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const testDatabase: TestDatabase = {
    supabase,
    supabaseUrl,
    supabaseKey,
    serviceRoleKey,

    async reset(): Promise<void> {
      console.log('🔄 Resetting test database...')

      // Clean up test data in correct order to respect foreign key constraints
      const tables = [
        'application_activities',
        'applications',
        'job_postings',
        'companies',
        'user_profiles',
        'auth.users',
      ]

      for (const table of tables) {
        try {
          // Delete only test data (users with test email pattern)
          if (table === 'auth.users') {
            await supabase.rpc('admin_delete_test_users')
          } else {
            await supabase.from(table).delete().or('created_by.like.%test%,email.like.%test%')
          }
        } catch (error) {
          console.warn(`Warning: Could not clean table ${table}:`, error)
        }
      }

      console.log('✅ Test database reset complete')
    },

    async cleanup(): Promise<void> {
      console.log('🧹 Cleaning up test database...')

      // Final cleanup
      await this.reset()

      console.log('✅ Test database cleanup complete')
    },

    async createUser(userData = {}): Promise<TestUser> {
      const defaultUserData = {
        email: `test-${Date.now()}@example.com`,
        password: 'test-password-123',
        user_metadata: {
          name: 'Test User',
          avatar_url: null,
        },
        ...userData,
      }

      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: defaultUserData.email,
        password: defaultUserData.password,
        email_confirm: true,
        user_metadata: defaultUserData.user_metadata,
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('Failed to create user: No user data returned')
      }

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: defaultUserData.email,
          name: defaultUserData.user_metadata.name,
          avatar_url: defaultUserData.user_metadata.avatar_url,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (profileError) throw profileError

      return {
        auth: {
          id: authData.user.id,
          email: authData.user.email || '',
          user_metadata: {
            name: authData.user.user_metadata?.name || 'Test User',
            avatar_url: authData.user.user_metadata?.avatar_url || null,
            bio: authData.user.user_metadata?.bio || undefined,
          },
          created_at: authData.user.created_at || new Date().toISOString(),
          updated_at: authData.user.updated_at || new Date().toISOString(),
          email_verified: true,
        },
        profile: profileData,
      }
    },

    async createApplication(
      userId: string,
      appData: Partial<MockApplicationRecord> = {}
    ): Promise<TestApplication> {
      const defaultAppData: MockApplicationRecord = {
        id: `app-${Date.now()}-${Math.random()}`,
        company_name: `Test Company ${Date.now()}`,
        job_title: 'Software Engineer',
        status: 'applied',
        description: 'Test application description',
        notes: 'Test notes',
        location: 'Remote',
        salary_min: 80000,
        salary_max: 120000,
        url: 'https://example.com/job',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...appData,
      }

      const { data, error } = await supabase
        .from('applications')
        .insert(defaultAppData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async createCompany(companyData: Partial<MockCompanyRecord> = {}): Promise<TestCompany> {
      const defaultCompanyData: MockCompanyRecord = {
        id: `company-${Date.now()}-${Math.random()}`,
        name: `Test Company ${Date.now()}`,
        description: 'Test company description',
        industry: 'Technology',
        size: '100-500',
        website: 'https://example.com',
        logo_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...companyData,
      }

      const { data, error } = await supabase
        .from('companies')
        .insert(defaultCompanyData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    async createJob(jobData: Partial<MockJobRecord> = {}): Promise<MockJobRecord> {
      const defaultJobData: MockJobRecord = {
        id: `job-${Date.now()}-${Math.random()}`,
        title: 'Software Engineer',
        description: 'Test job description',
        requirements: 'Test requirements',
        responsibilities: 'Test responsibilities',
        location: 'Remote',
        type: 'full-time',
        salary_min: 80000,
        salary_max: 120000,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...jobData,
      }

      const { data, error } = await supabase
        .from('job_postings')
        .insert(defaultJobData)
        .select()
        .single()

      if (error) throw error
      return data
    },
  }

  // Initialize test database schema if needed
  try {
    await supabase.rpc('ensure_test_schema')
  } catch (error) {
    console.warn('Warning: Could not ensure test schema:', error)
  }

  return testDatabase
}

// Mock database for when we don't have a real test database
export function createMockTestDatabase(): TestDatabase {
  const mockData: MockDataStorage = {
    users: new Map(),
    user_profiles: new Map(),
    applications: new Map(),
    companies: new Map(),
    application_activities: new Map(),
    jobs: new Map(),
  }

  // Track authentication state
  let currentUser: MockUser | null = null
  let currentSession: MockSession | null = null
  let dynamicTestUsers: MockAuthUser[] = [] // Store dynamically created test users

  // Create a comprehensive mock Supabase client with dynamic responses
  const mockSupabase = {
    auth: {
      signInWithPassword: vi.fn().mockImplementation(({ email, password }) => {
        // Check for network error simulation
        if (typeof global !== 'undefined' && global._simulateNetworkError) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('Network error'),
          })
        }

        // Check if global fetch is mocked and specifically configured to reject (pattern used in error handling tests)
        if (global.fetch && vi.isMockFunction(global.fetch)) {
          try {
            const mockFetch = global.fetch as MockFetchFunction
            // Only simulate network error if the mock is configured to reject
            if (mockFetch.mock && mockFetch.mock.results && mockFetch.mock.results.length > 0) {
              const lastResult = mockFetch.mock.results[mockFetch.mock.results.length - 1]
              if (lastResult.type === 'throw') {
                return Promise.resolve({
                  data: { user: null, session: null },
                  error: new Error('Network error'),
                })
              }
            }
            // Check if the mock was recently configured to reject (in this test run)
            if (mockFetch._isMockingNetworkError === true) {
              return Promise.resolve({
                data: { user: null, session: null },
                error: new Error('Network error'),
              })
            }
          } catch (_error) {
            // If checking mock state fails, don't assume network error
          }
        }

        // Support multiple test credentials - these are the standard test credentials
        const validCredentials = [
          { email: 'test@example.com', password: 'test-password-123' },
          { email: 'loginuser@example.com', password: 'LoginPassword123!' },
          { email: 'concurrent@example.com', password: 'ConcurrentPassword123!' },
          { email: 'profileuser@example.com', password: 'ProfilePassword123!' },
          { email: 'resetuser@example.com', password: 'OriginalPassword123!' },
          { email: 'securityuser@example.com', password: 'SecurityPassword123!' },
          { email: 'timeout@example.com', password: 'TimeoutPassword123!' },
          { email: 'middleware@example.com', password: 'MiddlewarePassword123!' },
          ...dynamicTestUsers, // Include dynamically created test users
        ]

        const credential = validCredentials.find(c => c.email === email && c.password === password)

        if (credential) {
          // Try to find existing user profile first for consistent ID
          let userId: string = ''
          let userMetadata: UserMetadata = { name: 'Test User', avatar_url: null, bio: 'Test bio' }

          for (const [id, profile] of mockData.user_profiles.entries()) {
            if (profile.email === email) {
              userId = id
              userMetadata = {
                name: profile.name || 'Test User',
                avatar_url: profile.avatar_url,
                bio: profile.bio,
              }
              break
            }
          }

          // If no existing profile found, generate a consistent ID
          if (!userId) {
            userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`
          }

          const user: MockUser = {
            id: userId,
            email: credential.email,
            user_metadata: userMetadata,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_verified: true,
          }
          const session = {
            access_token: 'mock-token',
            refresh_token: 'mock-refresh-token',
            expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
            user,
          }
          currentUser = user
          currentSession = session
          return Promise.resolve({ data: { user, session }, error: null })
        }
        return Promise.resolve({
          data: { user: null, session: null },
          error: new Error('Invalid login credentials'),
        })
      }),
      signUp: vi.fn().mockImplementation(userData => {
        const { email, password, options } = userData || {}

        // Check for network error simulation
        if (typeof global !== 'undefined' && global._simulateNetworkError) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('Network error'),
          })
        }

        // Check if global fetch is mocked and specifically configured to reject (pattern used in error handling tests)
        if (global.fetch && vi.isMockFunction(global.fetch)) {
          try {
            const mockFetch = global.fetch as MockFetchFunction
            // Only simulate network error if the mock is configured to reject
            if (mockFetch.mock && mockFetch.mock.results && mockFetch.mock.results.length > 0) {
              const lastResult = mockFetch.mock.results[mockFetch.mock.results.length - 1]
              if (lastResult.type === 'throw') {
                return Promise.resolve({
                  data: { user: null, session: null },
                  error: new Error('Network error'),
                })
              }
            }
            // Check if the mock was recently configured to reject (in this test run)
            if (mockFetch._isMockingNetworkError === true) {
              return Promise.resolve({
                data: { user: null, session: null },
                error: new Error('Network error'),
              })
            }
          } catch (_error) {
            // If checking mock state fails, don't assume network error
          }
        }

        // Ensure email is provided
        if (!email) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('Email is required'),
          })
        }

        // Check for duplicate email (simulate existing user test)
        if (email === 'existing@example.com' || email === 'duplicate@example.com') {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('user_already_exists'),
          })
        }

        // Validate email format
        if (!email.includes('@') || !email.includes('.')) {
          return Promise.resolve({
            data: { user: null, session: null },
            error: new Error('invalid_email'),
          })
        }

        // For test environment, accept all passwords regardless of strength
        const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`
        const user_metadata = options?.data || {
          name: 'Test User',
          avatar_url: null,
          bio: 'Test bio',
        }
        const user: MockUser = {
          id: userId,
          email,
          user_metadata,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_verified: true,
        }
        const session = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          expires_at: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
          user,
        }

        // Store user in user_profiles table
        const profile = {
          id: userId,
          user_id: userId,
          email,
          name: user_metadata.name || 'Test User',
          avatar_url: user_metadata.avatar_url,
          bio: user_metadata.bio,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        mockData.user_profiles.set(userId, profile)

        // Add to dynamic test users for future sign in (use default password if not provided)
        dynamicTestUsers.push({ email, password: password || 'test-password-123' })

        currentUser = user
        currentSession = session
        return Promise.resolve({ data: { user, session }, error: null })
      }),
      signOut: vi.fn().mockImplementation(() => {
        currentUser = null
        currentSession = null
        return Promise.resolve({ data: {}, error: null })
      }),
      getUser: vi.fn().mockImplementation(() => {
        return Promise.resolve({
          data: { user: currentUser },
          error: null,
        })
      }),
      getSession: vi.fn().mockImplementation(() => {
        return Promise.resolve({
          data: { session: currentSession },
          error: null,
        })
      }),
      updateUser: vi.fn().mockImplementation(params => {
        // Check for network error simulation
        if (typeof global !== 'undefined' && global._simulateNetworkError) {
          return Promise.resolve({
            data: { user: null },
            error: new Error('Network error'),
          })
        }

        // Check if global fetch is mocked and specifically configured to reject (pattern used in error handling tests)
        if (global.fetch && vi.isMockFunction(global.fetch)) {
          try {
            const mockFetch = global.fetch as MockFetchFunction
            // Only simulate network error if the mock is configured to reject
            if (mockFetch.mock && mockFetch.mock.results && mockFetch.mock.results.length > 0) {
              const lastResult = mockFetch.mock.results[mockFetch.mock.results.length - 1]
              if (lastResult.type === 'throw') {
                return Promise.resolve({
                  data: { user: null },
                  error: new Error('Network error'),
                })
              }
            }
            // Check if the mock was recently configured to reject (in this test run)
            if (mockFetch._isMockingNetworkError === true) {
              return Promise.resolve({
                data: { user: null },
                error: new Error('Network error'),
              })
            }
          } catch (_error) {
            // If checking mock state fails, don't assume network error
          }
        }

        const data = params?.data || {}

        // If no current user, return error
        if (!currentUser) {
          return Promise.resolve({
            data: { user: null },
            error: new Error('No user to update'),
          })
        }

        // Update user metadata
        if (data && Object.keys(data).length > 0) {
          currentUser.user_metadata = { ...currentUser.user_metadata, ...data }
        }

        // Update email if provided
        if (params?.email) {
          currentUser.email = params.email
          // Update the credentials in dynamic test users
          const credentialIndex = dynamicTestUsers.findIndex(c => c.email === currentUser!.email)
          if (credentialIndex !== -1) {
            dynamicTestUsers[credentialIndex].email = params.email
          }
        }

        // Update password if provided - we need to handle this differently since we can't get the old password
        if (params?.password) {
          // Find and update the credential in dynamic test users
          const credentialIndex = dynamicTestUsers.findIndex(c => c.email === currentUser!.email)
          if (credentialIndex !== -1) {
            dynamicTestUsers[credentialIndex].password = params.password
          }
        }

        // Update current session user
        if (currentSession) {
          currentSession.user = currentUser
        }

        return Promise.resolve({
          data: {
            user: {
              ...currentUser,
              user_metadata: currentUser.user_metadata,
              email: currentUser.email,
              created_at: currentUser.created_at,
              updated_at: new Date().toISOString(),
              email_verified: true,
            },
          },
          error: null,
        })
      }),
      resetPasswordForEmail: vi
        .fn()
        .mockImplementation((_email: string, _options?: ResetPasswordOptions) => {
          // Check for network error simulation
          if (typeof global !== 'undefined' && global._simulateNetworkError) {
            return Promise.resolve({
              data: {},
              error: new Error('Network error'),
            })
          }

          // Check if global fetch is mocked and specifically configured to reject (pattern used in error handling tests)
          if (global.fetch && vi.isMockFunction(global.fetch)) {
            try {
              const mockFetch = global.fetch as MockFetchFunction
              // Only simulate network error if the mock is configured to reject
              if (mockFetch.mock && mockFetch.mock.results && mockFetch.mock.results.length > 0) {
                const lastResult = mockFetch.mock.results[mockFetch.mock.results.length - 1]
                if (lastResult.type === 'throw') {
                  return Promise.resolve({
                    data: {},
                    error: new Error('Network error'),
                  })
                }
              }
              // Check if the mock was recently configured to reject (in this test run)
              if (mockFetch._isMockingNetworkError === true) {
                return Promise.resolve({
                  data: {},
                  error: new Error('Network error'),
                })
              }
            } catch (_error) {
              // If checking mock state fails, don't assume network error
            }
          }

          // Mock successful password reset request
          return Promise.resolve({
            data: {},
            error: null,
          })
        }),
      signInWithOAuth: vi.fn().mockImplementation(({ provider, options }: SignInOAuthData) => {
        // Check for network error simulation
        if (typeof global !== 'undefined' && global._simulateNetworkError) {
          return Promise.resolve({
            data: { url: null },
            error: new Error('Network error'),
          })
        }

        // Check if global fetch is mocked and specifically configured to reject (pattern used in error handling tests)
        if (global.fetch && vi.isMockFunction(global.fetch)) {
          try {
            const mockFetch = global.fetch as MockFetchFunction
            // Only simulate network error if the mock is configured to reject
            if (mockFetch.mock && mockFetch.mock.results && mockFetch.mock.results.length > 0) {
              const lastResult = mockFetch.mock.results[mockFetch.mock.results.length - 1]
              if (lastResult.type === 'throw') {
                return Promise.resolve({
                  data: { url: null },
                  error: new Error('Network error'),
                })
              }
            }
            // Check if the mock was recently configured to reject (in this test run)
            if (mockFetch._isMockingNetworkError === true) {
              return Promise.resolve({
                data: { url: null },
                error: new Error('Network error'),
              })
            }
          } catch (_error) {
            // If checking mock state fails, don't assume network error
          }
        }

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
        return Promise.resolve({
          data: { url: 'https://oauth.example.com' },
          error: null,
        })
      }),
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'mock-user-id' } },
          error: null,
        }),
      },
      _clearAuthState: vi.fn().mockImplementation(() => {
        currentUser = null
        currentSession = null
      }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      // Ensure we have a valid table data map
      const tableMap =
        (mockData[table as keyof typeof mockData] as Map<string, MockDatabaseRecord>) || new Map()
      let queryResult: MockDatabaseRecord[] = []

      // Convert values from Map to array safely
      try {
        const values: MockDatabaseRecord[] = []
        for (const value of tableMap.values()) {
          values.push(value)
        }
        queryResult = values
      } catch (_error) {
        queryResult = []
      }
      let isSingleResult = false
      let updateData: Partial<MockDatabaseRecord> | null = null
      let selectColumns: string | null = null
      let deleteOperation = false

      const executeQuery = () => {
        // Check for simulated network errors - simple flag approach
        if (typeof global !== 'undefined' && global._simulateNetworkError) {
          return Promise.reject(new Error('Network error'))
        }

        const insertError = (queryBuilder as { _insertError?: unknown })._insertError
        const constraintError = (queryBuilder as { _constraintError?: unknown })._constraintError
        if (insertError) {
          ;(queryBuilder as { _insertError?: unknown })._insertError = undefined
          return Promise.resolve({ data: null, error: insertError })
        }
        if (constraintError) {
          ;(queryBuilder as { _constraintError?: unknown })._constraintError = undefined
          return Promise.resolve({ data: null, error: constraintError })
        }

        // Apply RLS policies - users can only see their own data
        if (currentUser) {
          if (table === 'user_profiles') {
            // For user_profiles, filter by user_id field (which matches the auth.users.id)
            queryResult = queryResult.filter(
              item =>
                (item as { user_id?: string }).user_id === currentUser!.id ||
                item.id === currentUser!.id
            )
          } else if (table === 'applications' || table === 'application_activities') {
            // Users can only see their own applications and activities
            queryResult = queryResult.filter(item => item.created_by === currentUser!.id)
          }
        } else {
          // If no current user, return empty for user-specific tables
          if (
            table === 'user_profiles' ||
            table === 'applications' ||
            table === 'application_activities'
          ) {
            queryResult = []
          }
        }

        // Handle joins (for companies and application_activities relationships)
        if (selectColumns) {
          const columns = selectColumns // Store non-null value for proper type narrowing
          queryResult = queryResult.map(item => {
            let joinedItem = { ...item }

            // Handle companies join
            if (
              columns.includes('companies') &&
              item.company_id &&
              mockData.companies.has(item.company_id)
            ) {
              joinedItem.companies = mockData.companies.get(item.company_id)
            }

            // Handle application_activities join
            if (columns.includes('application_activities') && item.id) {
              const activities = Array.from(mockData.application_activities.values()).filter(
                activity => activity.application_id === item.id
              )
              joinedItem.application_activities = activities
            }

            return joinedItem
          })
        }

        if (deleteOperation) {
          // Enforce RLS for deletes - users can only delete their own data
          if (currentUser) {
            if (table === 'user_profiles') {
              // Filter to only user's own profile
              queryResult = queryResult.filter(
                item =>
                  (item as { user_id?: string }).user_id === currentUser!.id ||
                  item.id === currentUser!.id
              )
              if (queryResult.length === 0) {
                return Promise.resolve({
                  data: null,
                  error: new Error('Unauthorized: Cannot delete other users profile'),
                })
              }
            } else if (table === 'applications' || table === 'application_activities') {
              // Filter to only user's own data
              const filteredResult = queryResult.filter(item => item.created_by === currentUser!.id)
              if (filteredResult.length < queryResult.length) {
                // User is trying to delete other users' data
                return Promise.resolve({
                  data: null,
                  error: new Error('Unauthorized: Cannot delete other users data'),
                })
              }
              queryResult = filteredResult
            }
          } else {
            // No authenticated user - deny deletes to user-specific tables
            if (
              table === 'user_profiles' ||
              table === 'applications' ||
              table === 'application_activities'
            ) {
              return Promise.resolve({
                data: null,
                error: new Error('Unauthorized: Not authenticated'),
              })
            }
          }

          // Handle cascade delete for application activities
          const itemsToDelete = [...queryResult] // Store items before deletion for realtime events

          if (table === 'applications') {
            queryResult.forEach(item => {
              const itemId = item.id
              tableMap.delete(itemId)
              // Delete related activities
              Array.from(mockData.application_activities.values())
                .filter(activity => activity.application_id === itemId)
                .forEach(activity => mockData.application_activities.delete(activity.id))
            })
          } else {
            queryResult.forEach(item => {
              const itemId = item.id
              tableMap.delete(itemId)
            })
          }

          // Trigger realtime events for DELETE operations (only if harness is connected)
          if (
            typeof global !== 'undefined' &&
            global.testRealtimeHarness &&
            global.testRealtimeHarness.getConnectionStatus() &&
            itemsToDelete.length > 0
          ) {
            try {
              itemsToDelete.forEach(item => {
                global.testRealtimeHarness.simulateEvent({
                  event: 'DELETE',
                  schema: 'public',
                  table,
                  payload: item,
                })
              })
            } catch (_error) {
              // Ignore realtime errors in tests
            }
          }

          queryResult = []
        }

        if (updateData) {
          // Enforce RLS for updates - users can only update their own data
          if (currentUser) {
            if (table === 'user_profiles') {
              // Filter to only user's own profile
              queryResult = queryResult.filter(
                item =>
                  (item as { user_id?: string }).user_id === currentUser!.id ||
                  item.id === currentUser!.id
              )
              if (queryResult.length === 0) {
                return Promise.resolve({
                  data: null,
                  error: new Error('Unauthorized: Cannot update other users profile'),
                })
              }
            } else if (table === 'applications' || table === 'application_activities') {
              // Filter to only user's own data
              const filteredResult = queryResult.filter(item => item.created_by === currentUser!.id)
              if (filteredResult.length < queryResult.length) {
                // User is trying to update other users' data
                return Promise.resolve({
                  data: null,
                  error: new Error('Unauthorized: Cannot update other users data'),
                })
              }
              queryResult = filteredResult
            }
          } else {
            // No authenticated user - deny updates to user-specific tables
            if (
              table === 'user_profiles' ||
              table === 'applications' ||
              table === 'application_activities'
            ) {
              return Promise.resolve({
                data: null,
                error: new Error('Unauthorized: Not authenticated'),
              })
            }
          }

          // Apply update operation
          const updatedItems = queryResult.map(item => ({
            ...item,
            ...updateData,
            updated_at: new Date().toISOString(),
          }))

          // Update the actual data in mockData storage
          updatedItems.forEach(item => {
            tableMap.set(item.id, item)
          })

          // Trigger realtime events for UPDATE operations (only if harness is connected)
          if (
            typeof global !== 'undefined' &&
            global.testRealtimeHarness &&
            global.testRealtimeHarness.getConnectionStatus() &&
            updatedItems.length > 0
          ) {
            try {
              updatedItems.forEach(item => {
                global.testRealtimeHarness.simulateEvent({
                  event: 'UPDATE',
                  schema: 'public',
                  table,
                  payload: item,
                })
              })
            } catch (_error) {
              // Ignore realtime errors in tests
            }
          }

          queryResult = updatedItems
          updateData = null
        }

        const result = isSingleResult
          ? queryResult.length > 0
            ? { data: queryResult[0], error: null }
            : { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
          : { data: queryResult, error: null }

        return Promise.resolve(result)
      }

      const queryBuilder = {
        select: vi.fn().mockImplementation((columns: string) => {
          selectColumns = columns
          return queryBuilder
        }),
        insert: vi.fn().mockImplementation((data: MockDatabaseRecord | MockDatabaseRecord[]) => {
          // Basic validation for required fields
          if (table === 'applications') {
            // Handle both array and single object inserts
            const dataArray = Array.isArray(data) ? data : [data]
            for (const item of dataArray) {
              if (!item.company_name || !item.job_title) {
                queryResult = []
                ;(queryBuilder as { _insertError?: { message: string } })._insertError = {
                  message: 'Required fields missing',
                }
                return queryBuilder
              }
            }
          }
          if (table === 'companies') {
            // Handle both array and single object inserts
            const dataArray = Array.isArray(data) ? data : [data]
            for (const item of dataArray) {
              if (!item.name) {
                queryResult = []
                ;(queryBuilder as { _insertError?: { message: string } })._insertError = {
                  message: 'Company name required',
                }
                return queryBuilder
              }
            }
          }

          const insertRecord = (record: MockDatabaseRecord) => {
            const uniqueId = `${table}-${Date.now()}-${Math.random()}`
            const timestamp = new Date().toISOString()
            const newItem = {
              ...record,
              id: uniqueId,
              created_at: timestamp,
              updated_at: timestamp,
            }
            tableMap.set(uniqueId, newItem)

            // Trigger realtime event for INSERT operations (only if harness is connected)
            if (
              typeof global !== 'undefined' &&
              global.testRealtimeHarness &&
              global.testRealtimeHarness.getConnectionStatus()
            ) {
              try {
                global.testRealtimeHarness.simulateEvent({
                  event: 'INSERT',
                  schema: 'public',
                  table,
                  payload: newItem,
                })
              } catch (_error) {
                // Ignore realtime errors in tests
              }
            }

            return newItem
          }

          if (Array.isArray(data)) {
            queryResult = data.map(insertRecord)
          } else {
            const newItem = insertRecord(data)
            queryResult = [newItem]
          }
          return queryBuilder
        }),
        update: vi.fn().mockImplementation((data: Partial<MockDatabaseRecord>) => {
          updateData = data
          return queryBuilder
        }),
        delete: vi.fn().mockImplementation(() => {
          deleteOperation = true
          return queryBuilder
        }),
        eq: vi.fn().mockImplementation((column: string, value: MockQueryValue) => {
          queryResult = queryResult.filter(
            item => (item as Record<string, unknown>)[column] === value
          )
          return queryBuilder
        }),
        order: vi.fn().mockImplementation((column: string, options?: { ascending?: boolean }) => {
          queryResult.sort((a: MockDatabaseRecord, b: MockDatabaseRecord) => {
            const aVal = a[column] as string | number | boolean | null | undefined
            const bVal = b[column] as string | number | boolean | null | undefined
            const ascending = options?.ascending !== false

            // Handle string comparison (especially for company names)
            if (typeof aVal === 'string' && typeof bVal === 'string') {
              const comparison = aVal.localeCompare(bVal)
              return ascending ? comparison : -comparison
            }

            // Handle numeric/date comparison
            if (typeof aVal === 'number' && typeof bVal === 'number') {
              if (aVal < bVal) return ascending ? -1 : 1
              if (aVal > bVal) return ascending ? 1 : -1
            }
            return 0
          })
          return queryBuilder
        }),
        range: vi.fn().mockImplementation((from: number, to: number) => {
          queryResult = queryResult.slice(from, to + 1)
          return queryBuilder
        }),
        limit: vi.fn().mockImplementation((count: number) => {
          queryResult = queryResult.slice(0, count)
          return queryBuilder
        }),
        ilike: vi.fn().mockImplementation((column: string, value: string) => {
          const searchValue = value.replace(/%/g, '').toLowerCase()
          queryResult = queryResult.filter((item: MockDatabaseRecord) =>
            String(item[column]).toLowerCase().includes(searchValue)
          )
          return queryBuilder
        }),
        in: vi.fn().mockImplementation((column: string, values: MockQueryValue[]) => {
          queryResult = queryResult.filter((item: MockDatabaseRecord) =>
            values.includes(item[column] as MockQueryValue)
          )
          return queryBuilder
        }),
        gte: vi.fn().mockImplementation((column: string, value: MockQueryValue) => {
          queryResult = queryResult.filter(
            (item: MockDatabaseRecord) => (item[column] as number) >= (value as number)
          )
          return queryBuilder
        }),
        lte: vi.fn().mockImplementation((column: string, value: MockQueryValue) => {
          queryResult = queryResult.filter(
            (item: MockDatabaseRecord) => (item[column] as number) <= (value as number)
          )
          return queryBuilder
        }),
        or: vi.fn().mockImplementation((_query: string) => {
          // Simple OR implementation - just return all data for now
          // In a real implementation, this would parse the query string
          return queryBuilder
        }),
        not: vi
          .fn()
          .mockImplementation((column: string, operator: string, value: MockQueryValue) => {
            // Simple NOT implementation - filter out items that match the condition
            queryResult = queryResult.filter((item: MockDatabaseRecord) => {
              if (operator === 'is') {
                return item[column] !== value
              }
              if (operator === 'eq') {
                return item[column] !== value
              }
              // For other operators, just include the item (simplified)
              return true
            })
            return queryBuilder
          }),
        single: vi.fn().mockImplementation(() => {
          isSingleResult = true
          return queryBuilder
        }),
        then: vi
          .fn()
          .mockImplementation(
            (resolve: (value: unknown) => void, reject?: (reason: unknown) => void) => {
              return executeQuery().then(resolve, reject)
            }
          ),
      }

      return queryBuilder
    }),
    rpc: vi.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'mock-path' },
          error: null,
        }),
        download: vi.fn().mockResolvedValue({
          data: new Blob(),
          error: null,
        }),
        remove: vi.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    },
  }

  return {
    supabase: mockSupabase as unknown as MockSupabaseClient,
    supabaseUrl: 'https://mock.supabase.co',
    supabaseKey: 'mock-key',
    serviceRoleKey: 'mock-service-key',

    async reset(): Promise<void> {
      // Clear authentication state without clearing mock implementations
      currentUser = null
      currentSession = null

      // Clear data
      mockData.users.clear()
      mockData.user_profiles.clear()
      mockData.applications.clear()
      mockData.companies.clear()
      mockData.application_activities.clear()
      mockData.jobs.clear()

      // Clear dynamic test users
      dynamicTestUsers = []
    },

    async cleanup(): Promise<void> {
      await this.reset()
    },

    async createUser(userData = {}): Promise<TestUser> {
      const id = `user-${Date.now()}-${Math.random()}`
      const email = userData.email || `test-${Date.now()}@example.com`
      const name = userData.name || userData.user_metadata?.name || 'Test User'
      const password = userData.password || 'test-password-123'

      const user: MockUser = {
        id,
        email,
        user_metadata: { name, avatar_url: null, bio: 'Test bio' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: true,
      }
      const profile = {
        id,
        email,
        name,
        avatar_url: userData.user_metadata?.avatar_url || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Add to dynamic test users for future sign in
      dynamicTestUsers.push({ email, password })

      // Store in both users and user_profiles tables
      mockData.users.set(id, { ...user, ...profile })
      mockData.user_profiles.set(id, profile)

      // Set as current authenticated user
      currentUser = user
      currentSession = {
        access_token: 'mock-token',
        user,
      }

      return { auth: user, profile }
    },

    async createApplication(
      userId: string,
      appData: Partial<MockApplicationRecord> = {}
    ): Promise<TestApplication> {
      // Add a small delay to ensure different timestamps for ordering tests
      await new Promise(resolve => setTimeout(resolve, 1))
      const timestamp = new Date().toISOString()
      const id = `app-${Date.now()}-${Math.random()}`
      const application: MockApplicationRecord = {
        id,
        created_by: currentUser?.id || userId, // Use current authenticated user ID if available
        company_name: 'Test Company',
        job_title: 'Software Engineer',
        status: 'applied',
        created_at: timestamp,
        updated_at: timestamp,
        ...appData,
      }
      mockData.applications.set(id, application)
      return application as unknown as TestApplication
    },

    async createCompany(companyData: Partial<MockCompanyRecord> = {}): Promise<TestCompany> {
      const id = `company-${Date.now()}-${Math.random()}`
      const company: MockCompanyRecord = {
        id,
        name: 'Test Company',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...companyData,
      }
      mockData.companies.set(id, company)
      return company as unknown as TestCompany
    },

    async createJob(jobData: Partial<MockJobRecord> = {}): Promise<MockJobRecord> {
      const id = `job-${Date.now()}-${Math.random()}`
      const job: MockJobRecord = {
        id,
        title: 'Software Engineer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...jobData,
      }
      mockData.jobs.set(id, job)
      return job
    },
  }
}
