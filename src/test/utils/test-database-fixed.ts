import { vi } from 'vitest'
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
  MockDataStorage,
  MockQueryValue,
} from './test-utils.types'

// Extended query builder with internal properties for test mocking
interface ExtendedQueryBuilder {
  _joinTables?: string[]
  [key: string]: unknown
}

export interface TestDatabase extends StrictTestDatabase {
  supabase: MockSupabaseClient
  createApplication: (
    userId: string,
    appData?: Partial<MockApplicationRecord>
  ) => Promise<TestApplication>
  createCompany: (companyData?: Partial<MockCompanyRecord>) => Promise<TestCompany>
  createJob: (jobData?: Partial<MockJobRecord>) => Promise<MockJobRecord>
}

export function createMockTestDatabaseFixed(): TestDatabase {
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
  let dynamicTestUsers: MockAuthUser[] = []

  // Create a consistent mock supabase client (not importing from supabase mock to avoid circular dependencies)
  const createEnhancedMockSupabaseClient = (): MockSupabaseClient => {
    const mockFrom = vi.fn((table: string) => {
      const tableMap =
        (mockData[table as keyof typeof mockData] as Map<string, MockDatabaseRecord>) || new Map()
      let queryResult: MockDatabaseRecord[] = []

      try {
        const values: MockDatabaseRecord[] = []
        for (const value of tableMap.values()) {
          values.push(value)
        }
        queryResult = values
      } catch (_error) {
        queryResult = []
      }

      // Enhanced query builder with proper method chaining and state management
      let isSingle = false
      let validationError: { code: string; message: string } | null = null

      const queryBuilder = {
        select: vi.fn((columns?: string) => {
          // Handle column selection with RLS enforcement and JOIN support
          if (columns && typeof columns === 'string') {
            // Check for nested selects (JOINs) like "*, companies(*), application_activities(*)"
            const joinMatches = columns.matchAll(/(\w+)\s*\([^)]*\)/g)
            const joinTables: string[] = []
            for (const match of joinMatches) {
              if (match[1]) {
                joinTables.push(match[1]) // e.g., "companies", "application_activities"
              }
            }
            if (joinTables.length > 0 && table === 'applications') {
              // Mark that we need to populate these relations after filtering
              ;(queryBuilder as ExtendedQueryBuilder)._joinTables = joinTables
            }
          }

          // Enforce RLS for user_profiles - require authentication
          if (table === 'user_profiles' && !currentUser) {
            validationError = {
              code: 'PGRST301',
              message: 'JWT expired',
            }
            queryResult = []
          }

          return queryBuilder
        }),
        insert: vi.fn((data: MockDatabaseRecord | MockDatabaseRecord[]) => {
          // Add data to table storage with validation
          try {
            const records = Array.isArray(data) ? data : [data]

            // Validate NOT NULL constraints for applications table
            if (table === 'applications') {
              for (const record of records) {
                if (!record.job_title) {
                  validationError = {
                    code: '23502',
                    message: 'null value in column "job_title" violates not-null constraint',
                  }
                  queryResult = []
                  return queryBuilder
                }
                if (!record.user_id && !record.created_by) {
                  validationError = {
                    code: '23502',
                    message: 'null value in column "user_id" violates not-null constraint',
                  }
                  queryResult = []
                  return queryBuilder
                }

                // Validate foreign key constraint for user_id/created_by
                const userId = record.user_id || record.created_by
                if (userId) {
                  const usersMap = mockData.users
                  const userProfilesMap = mockData.user_profiles
                  if (!usersMap.has(userId as string) && !userProfilesMap.has(userId as string)) {
                    validationError = {
                      code: '23503',
                      message:
                        'insert or update on table "applications" violates foreign key constraint',
                    }
                    queryResult = []
                    return queryBuilder
                  }
                }

                // Validate that null or missing values are rejected for required fields
                if (record.company_name === null || record.company_name === undefined) {
                  validationError = {
                    code: '23502',
                    message: 'null value in column "company_name" violates not-null constraint',
                  }
                  queryResult = []
                  return queryBuilder
                }
              }
            }

            // Validate NOT NULL constraints for user_profiles table
            if (table === 'user_profiles') {
              for (const record of records) {
                if (!record.id && !record.user_id) {
                  validationError = {
                    code: '23502',
                    message: 'null value in column "id" violates not-null constraint',
                  }
                  queryResult = []
                  return queryBuilder
                }
              }
            }

            const insertedRecords: MockDatabaseRecord[] = []
            records.forEach(record => {
              const recordWithId = {
                ...record,
                id: record.id || `record-${Date.now()}-${Math.random()}`,
                created_at: record.created_at || new Date().toISOString(),
                updated_at: record.updated_at || new Date().toISOString(),
              }
              tableMap.set(recordWithId.id, recordWithId)
              insertedRecords.push(recordWithId)

              // Trigger realtime event for INSERT
              if ((global as Record<string, unknown>).testRealtimeHarness) {
                const harness = (global as Record<string, unknown>).testRealtimeHarness as {
                  simulateEvent: (event: Record<string, unknown>) => void
                }
                harness.simulateEvent({
                  event: 'INSERT',
                  schema: 'public',
                  table,
                  payload: recordWithId,
                })
              }
            })
            // Set queryResult to only the newly inserted records
            queryResult = insertedRecords
          } catch (_error) {
            // Continue silently for mock
          }
          return queryBuilder
        }),
        update: vi.fn((data: Partial<MockDatabaseRecord>) => {
          // Update existing records with RLS enforcement
          try {
            // For applications and user_profiles, enforce RLS policies
            if ((table === 'applications' || table === 'user_profiles') && currentUser) {
              const updatedRecords: MockDatabaseRecord[] = []

              // Only update records in queryResult (i.e., already filtered by eq())
              for (const record of queryResult) {
                // Check if the record belongs to the current user
                // For user_profiles: record.id IS the user ID
                // For applications: use created_by or user_id
                let isOwner = false
                if (table === 'user_profiles') {
                  isOwner = record.id === currentUser.id
                } else {
                  const recordUserId = record.user_id || record.created_by
                  isOwner = recordUserId === currentUser.id
                }

                if (isOwner) {
                  const updatedRecord = {
                    ...record,
                    ...data,
                    updated_at: new Date().toISOString(),
                  }
                  tableMap.set(record.id, updatedRecord)
                  updatedRecords.push(updatedRecord)

                  // Trigger realtime event for UPDATE
                  if ((global as Record<string, unknown>).testRealtimeHarness) {
                    const harness = (global as Record<string, unknown>).testRealtimeHarness as {
                      simulateEvent: (event: Record<string, unknown>) => void
                    }
                    harness.simulateEvent({
                      event: 'UPDATE',
                      schema: 'public',
                      table,
                      payload: updatedRecord,
                    })
                  }
                }
                // RLS: Silently skip records user doesn't own (PostgreSQL behavior)
              }

              queryResult = updatedRecords
            } else {
              // No RLS enforcement for other tables or unauthenticated requests
              for (const record of queryResult) {
                const updatedRecord = {
                  ...record,
                  ...data,
                  updated_at: new Date().toISOString(),
                }
                tableMap.set(record.id, updatedRecord)

                // Trigger realtime event for UPDATE
                if ((global as Record<string, unknown>).testRealtimeHarness) {
                  const harness = (global as Record<string, unknown>).testRealtimeHarness as {
                    simulateEvent: (event: Record<string, unknown>) => void
                  }
                  harness.simulateEvent({
                    event: 'UPDATE',
                    schema: 'public',
                    table,
                    payload: updatedRecord,
                  })
                }
              }
              // Refresh query result with updated records
              const updatedResults: MockDatabaseRecord[] = []
              for (const record of queryResult) {
                updatedResults.push(tableMap.get(record.id)!)
              }
              queryResult = updatedResults
            }
          } catch (_error) {
            // Continue silently for mock
          }
          return queryBuilder
        }),
        delete: vi.fn(() => {
          // Delete filtered records with CASCADE behavior
          try {
            queryResult.forEach(record => {
              // Trigger realtime event for DELETE before actually deleting
              if ((global as Record<string, unknown>).testRealtimeHarness) {
                const harness = (global as Record<string, unknown>).testRealtimeHarness as {
                  simulateEvent: (event: Record<string, unknown>) => void
                }
                harness.simulateEvent({
                  event: 'DELETE',
                  schema: 'public',
                  table,
                  payload: { ...record },
                })
              }

              tableMap.delete(record.id)

              // Handle CASCADE deletes for applications
              if (table === 'applications') {
                // Delete related application_activities
                const activitiesMap = mockData.application_activities as Map<
                  string,
                  MockDatabaseRecord
                >
                const activitiesToDelete: string[] = []
                for (const [activityId, activity] of activitiesMap.entries()) {
                  if (activity.application_id === record.id) {
                    activitiesToDelete.push(activityId)
                  }
                }
                activitiesToDelete.forEach(id => activitiesMap.delete(id))
              }
            })
            queryResult = []
          } catch (_error) {
            // Continue silently for mock
          }
          return queryBuilder
        }),
        eq: vi.fn((column: string, value: MockQueryValue) => {
          try {
            queryResult = queryResult.filter(
              item => (item as Record<string, unknown>)[column] === value
            )

            // Apply RLS filtering for user_profiles and applications after eq
            if ((table === 'user_profiles' || table === 'applications') && currentUser) {
              const userId = currentUser.id
              queryResult = queryResult.filter(record => {
                // For user_profiles: record.id IS the user ID
                // For applications: use created_by or user_id
                if (table === 'user_profiles') {
                  return record.id === userId
                } else {
                  const recordUserId = record.user_id || record.created_by
                  return recordUserId === userId
                }
              })
            }
          } catch (_error) {
            queryResult = []
          }
          return queryBuilder
        }),
        order: vi.fn((column: string, options?: { ascending?: boolean }) => {
          try {
            const ascending = options?.ascending !== false
            queryResult = queryResult.sort((a, b) => {
              const aVal = (a as Record<string, unknown>)[column]
              const bVal = (b as Record<string, unknown>)[column]
              if (aVal === null || aVal === undefined) return 1
              if (bVal === null || bVal === undefined) return -1
              if (aVal < bVal) return ascending ? -1 : 1
              if (aVal > bVal) return ascending ? 1 : -1
              return 0
            })
          } catch (_error) {
            // Keep original order if sorting fails
          }
          return queryBuilder
        }),
        in: vi.fn((column: string, values: MockQueryValue[]) => {
          try {
            queryResult = queryResult.filter(item =>
              values.includes((item as Record<string, unknown>)[column] as MockQueryValue)
            )
          } catch (_error) {
            queryResult = []
          }
          return queryBuilder
        }),
        gte: vi.fn((column: string, value: MockQueryValue) => {
          try {
            queryResult = queryResult.filter(item => {
              const itemValue = (item as Record<string, unknown>)[column] as MockQueryValue
              return (
                itemValue !== null &&
                itemValue !== undefined &&
                value !== null &&
                value !== undefined &&
                itemValue >= value
              )
            })
          } catch (_error) {
            queryResult = []
          }
          return queryBuilder
        }),
        lte: vi.fn((column: string, value: MockQueryValue) => {
          try {
            queryResult = queryResult.filter(item => {
              const itemValue = (item as Record<string, unknown>)[column] as MockQueryValue
              return (
                itemValue !== null &&
                itemValue !== undefined &&
                value !== null &&
                value !== undefined &&
                itemValue <= value
              )
            })
          } catch (_error) {
            queryResult = []
          }
          return queryBuilder
        }),
        ilike: vi.fn((column: string, value: string) => {
          try {
            const regex = new RegExp(value.replace(/%/g, '.*'), 'i')
            queryResult = queryResult.filter(item =>
              regex.test(String((item as Record<string, unknown>)[column] || ''))
            )
          } catch (_error) {
            queryResult = []
          }
          return queryBuilder
        }),
        or: vi.fn((_query: string) => {
          // Basic OR implementation - could be enhanced
          return queryBuilder
        }),
        range: vi.fn((from: number, to: number) => {
          try {
            queryResult = queryResult.slice(from, to + 1)
          } catch (_error) {
            queryResult = []
          }
          return queryBuilder
        }),
        limit: vi.fn((count: number) => {
          try {
            queryResult = queryResult.slice(0, count)
          } catch (_error) {
            queryResult = []
          }
          return queryBuilder
        }),
        not: vi.fn((column: string, operator: string, value: MockQueryValue) => {
          try {
            if (operator === 'eq') {
              queryResult = queryResult.filter(
                item => (item as Record<string, unknown>)[column] !== value
              )
            }
          } catch (_error) {
            queryResult = []
          }
          return queryBuilder
        }),
        single: vi.fn(() => {
          isSingle = true
          return queryBuilder
        }),
        then: vi.fn((resolve?: (value: unknown) => void, reject?: (reason: unknown) => void) => {
          try {
            // Check for simulated network error first
            if ((global as Record<string, unknown>)._simulateNetworkError) {
              const networkError = new Error('Network request failed')
              if (reject) {
                reject(networkError)
              }
              return Promise.reject(networkError)
            }

            // Check for validation errors
            if (validationError) {
              const result = { data: null, error: validationError }
              // Reset error after returning it
              validationError = null
              if (resolve) resolve(result)
              return Promise.resolve(result)
            }

            // Populate JOIN relations if needed
            const joinTables = (queryBuilder as ExtendedQueryBuilder)._joinTables
            if (
              joinTables &&
              Array.isArray(joinTables) &&
              joinTables.length > 0 &&
              queryResult.length > 0
            ) {
              queryResult = queryResult.map(record => {
                const enrichedRecord = { ...record }

                for (const joinTable of joinTables) {
                  const joinMap = mockData[joinTable as keyof typeof mockData] as Map<
                    string,
                    MockDatabaseRecord
                  >
                  if (!joinMap) continue

                  // Convert "companies" to "company_id", "application_activities" stays as is
                  let singularTable = joinTable.endsWith('ies')
                    ? joinTable.slice(0, -3) + 'y'
                    : joinTable.slice(0, -1)
                  const foreignKeyColumn = `${singularTable}_id` // e.g., "company_id" from "companies"

                  // Check if base record has foreign key to joined table (one-to-one or many-to-one)
                  const foreignKey = record[foreignKeyColumn]
                  if (foreignKey && joinMap.has(foreignKey as string)) {
                    enrichedRecord[joinTable] = joinMap.get(foreignKey as string)
                  } else {
                    // Check if joined table has foreign key to base record (one-to-many)
                    // e.g., application_activities.application_id -> applications.id
                    const relatedRecords: MockDatabaseRecord[] = []
                    for (const [, joinedRecord] of joinMap.entries()) {
                      // Check common foreign key patterns
                      const baseTableSingular = table.endsWith('s') ? table.slice(0, -1) : table
                      const baseForeignKeyColumn = `${baseTableSingular}_id`
                      if (joinedRecord[baseForeignKeyColumn] === record.id) {
                        relatedRecords.push(joinedRecord)
                      }
                    }
                    if (relatedRecords.length > 0) {
                      enrichedRecord[joinTable] = relatedRecords
                    }
                  }
                }

                return enrichedRecord
              })
            }

            // Apply RLS filtering as final step before returning results
            // This catches SELECT queries without eq() filtering
            if (
              (table === 'applications' || table === 'user_profiles') &&
              currentUser &&
              queryResult.length > 0
            ) {
              const userId = currentUser.id
              queryResult = queryResult.filter(record => {
                if (table === 'user_profiles') {
                  return record.id === userId
                } else {
                  const recordUserId = record.user_id || record.created_by
                  return recordUserId === userId
                }
              })
            }

            const result = isSingle
              ? queryResult.length > 0
                ? { data: queryResult[0], error: null }
                : { data: null, error: { code: 'PGRST116', message: 'No rows found' } }
              : { data: queryResult, error: null }

            if (resolve) resolve(result)
            return Promise.resolve(result)
          } catch (error) {
            if (reject) reject(error)
            return Promise.reject(error)
          }
        }),
      }

      return queryBuilder
    })

    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        signOut: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
        signInWithPassword: vi
          .fn()
          .mockResolvedValue({ data: { user: null, session: null }, error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
        signInWithOAuth: vi.fn().mockResolvedValue({ data: { url: null }, error: null }),
        admin: {
          createUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        },
      },
      from: mockFrom,
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
      storage: {
        from: vi.fn().mockReturnValue({
          upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
          download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
          remove: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
    }
  }

  // Use global enhanced mock client if available, otherwise create new one
  let mockSupabase: MockSupabaseClient
  if (typeof global !== 'undefined' && global.__globalSupabaseMock) {
    mockSupabase = global.__globalSupabaseMock as unknown as MockSupabaseClient
  } else {
    mockSupabase = createEnhancedMockSupabaseClient() as unknown as MockSupabaseClient
    // Store in global if it exists
    if (typeof global !== 'undefined') {
      ;(global as { __globalSupabaseMock?: unknown }).__globalSupabaseMock = mockSupabase
    }
  }

  // Helper function to find user by credentials
  const findUserByCredentials = (email: string, password: string): MockAuthUser | null => {
    const validCredentials = [
      { email: 'test@example.com', password: 'test-password-123' },
      { email: 'loginuser@example.com', password: 'LoginPassword123!' },
      { email: 'concurrent@example.com', password: 'ConcurrentPassword123!' },
      { email: 'profileuser@example.com', password: 'ProfilePassword123!' },
      { email: 'resetuser@example.com', password: 'OriginalPassword123!' },
      { email: 'securityuser@example.com', password: 'SecurityPassword123!' },
      { email: 'timeout@example.com', password: 'TimeoutPassword123!' },
      { email: 'middleware@example.com', password: 'MiddlewarePassword123!' },
      ...dynamicTestUsers,
    ]
    return validCredentials.find(c => c.email === email && c.password === password) || null
  }

  // Set up comprehensive auth implementations
  mockSupabase.auth.signInWithPassword!.mockImplementation((args: unknown) => {
    const { email, password } = args as { email: string; password: string }
    if (!email || !password) {
      return Promise.resolve({
        data: { user: null, session: null },
        error: new Error('Email and password are required'),
      })
    }

    const credential = findUserByCredentials(email, password)
    if (!credential) {
      return Promise.resolve({
        data: { user: null, session: null },
        error: new Error('Invalid login credentials'),
      })
    }

    // Find existing user in mockData.users by email
    let existingUser: MockUser | undefined
    for (const [, user] of mockData.users.entries()) {
      if (user.email === email) {
        existingUser = user
        break
      }
    }

    // If user exists, use it; otherwise create a new user (for backward compatibility)
    const user: MockUser = existingUser || {
      id: `user-${email.replace(/[^a-zA-Z0-9]/g, '')}`,
      email: credential.email,
      user_metadata: { name: 'Test User', avatar_url: null, bio: 'Test bio' },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_verified: true,
    }

    const session: MockSession = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }

    currentUser = user
    currentSession = session

    return Promise.resolve({ data: { user, session }, error: null })
  })

  mockSupabase.auth.signUp!.mockImplementation((args: unknown) => {
    if (!args || typeof args !== 'object') {
      return Promise.resolve({
        data: { user: null, session: null },
        error: new Error('User data is required'),
      })
    }

    const userData = args as {
      email?: string
      password?: string
      options?: { data?: { name?: string; avatar_url?: string | null; bio?: string } }
    }
    const { email, password, options } = userData

    if (!email || typeof email !== 'string') {
      return Promise.resolve({
        data: { user: null, session: null },
        error: new Error('Email is required'),
      })
    }

    if (email === 'existing@example.com' || email === 'duplicate@example.com') {
      return Promise.resolve({
        data: { user: null, session: null },
        error: new Error('user_already_exists'),
      })
    }

    if (email === 'invalid-email') {
      return Promise.resolve({
        data: { user: null, session: null },
        error: new Error('invalid_email'),
      })
    }

    const userId = `user-${email.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`
    const user: MockUser = {
      id: userId,
      email,
      user_metadata: {
        name: options?.data?.name || 'Test User',
        avatar_url: options?.data?.avatar_url || null,
        bio: options?.data?.bio || 'Test bio',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_verified: true,
    }
    const session: MockSession = {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user,
    }

    // Store user in user_profiles table
    const profile = {
      id: userId,
      user_id: userId,
      email,
      name: user.user_metadata.name || 'Test User',
      avatar_url: user.user_metadata.avatar_url,
      bio: user.user_metadata.bio,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    mockData.user_profiles.set(userId, profile)
    mockData.users.set(userId, user)

    // Add to dynamic test users with actual password
    dynamicTestUsers.push({ email, password: password || 'test-password-123' })

    currentUser = user
    currentSession = session

    return Promise.resolve({ data: { user, session }, error: null })
  })

  mockSupabase.auth.signOut!.mockImplementation(() => {
    currentUser = null
    currentSession = null
    return Promise.resolve({ data: {}, error: null })
  })

  mockSupabase.auth.getUser!.mockImplementation(() => {
    return Promise.resolve({ data: { user: currentUser }, error: null })
  })

  mockSupabase.auth.getSession!.mockImplementation(() => {
    return Promise.resolve({ data: { session: currentSession }, error: null })
  })

  mockSupabase.auth.updateUser!.mockImplementation((args: unknown) => {
    if (!args || typeof args !== 'object') {
      return Promise.resolve({
        data: { user: null },
        error: new Error('Update parameters are required'),
      })
    }

    const params = args as { email?: string; data?: Record<string, unknown> }
    const data = params?.data || {}
    const updatedUser: MockUser = {
      id: currentUser?.id || 'mock-user-id',
      email: params?.email || currentUser?.email || 'updated@example.com',
      user_metadata: {
        name: (data.name as string) || currentUser?.user_metadata?.name || 'Test User',
        avatar_url:
          (data.avatar_url as string | null) || currentUser?.user_metadata?.avatar_url || null,
        bio: (data.bio as string) || currentUser?.user_metadata?.bio || 'Test bio',
      },
      created_at: currentUser?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      email_verified: true,
    }

    if (currentUser) {
      currentUser = updatedUser
    }

    return Promise.resolve({ data: { user: updatedUser }, error: null })
  })

  mockSupabase.auth.resetPasswordForEmail!.mockImplementation((args: unknown) => {
    // Handle both single string argument and object arguments
    if (typeof args === 'string') {
      const email = args
      if (!email || typeof email !== 'string') {
        return Promise.resolve({ data: {}, error: new Error('Email is required') })
      }

      if (!email.includes('@') || !email.includes('.')) {
        return Promise.resolve({ data: {}, error: new Error('Invalid email format') })
      }

      return Promise.resolve({ data: {}, error: null })
    }

    // Handle case where it's called as resetPasswordForEmail(email, options)
    if (Array.isArray(args) && args.length >= 1) {
      const email = args[0] as string
      if (!email || typeof email !== 'string') {
        return Promise.resolve({ data: {}, error: new Error('Email is required') })
      }

      if (!email.includes('@') || !email.includes('.')) {
        return Promise.resolve({ data: {}, error: new Error('Invalid email format') })
      }

      return Promise.resolve({ data: {}, error: null })
    }

    return Promise.resolve({ data: {}, error: new Error('Email is required') })
  })

  mockSupabase.auth.signInWithOAuth!.mockImplementation((args: unknown) => {
    const { provider, options } = args as { provider: string; options?: { redirectTo?: string } }
    if (!provider || typeof provider !== 'string') {
      return Promise.resolve({
        data: { url: null },
        error: new Error('OAuth provider is required'),
      })
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
        return Promise.resolve({ data: { url }, error: null })
      }
      if (provider === 'invalid-provider') {
        return Promise.resolve({ data: { url: null }, error: new Error('Invalid OAuth provider') })
      }
      return Promise.resolve({ data: { url: 'https://oauth.example.com' }, error: null })
    } catch (_error) {
      return Promise.resolve({ data: { url: null }, error: new Error('OAuth sign in failed') })
    }
  })

  return {
    supabase: mockSupabase,
    supabaseUrl: 'https://mock.supabase.co',
    supabaseKey: 'mock-key',
    serviceRoleKey: 'mock-service-key',

    async reset(): Promise<void> {
      currentUser = null
      currentSession = null
      mockData.users.clear()
      mockData.user_profiles.clear()
      mockData.applications.clear()
      mockData.companies.clear()
      mockData.application_activities.clear()
      mockData.jobs.clear()
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

      dynamicTestUsers.push({ email, password })
      mockData.users.set(id, { ...user, ...profile })
      mockData.user_profiles.set(id, profile)

      currentUser = user
      currentSession = { access_token: 'mock-token', user }

      return { auth: user, profile }
    },

    async createApplication(
      userId: string,
      appData: Partial<MockApplicationRecord> = {}
    ): Promise<TestApplication> {
      await new Promise(resolve => setTimeout(resolve, 1))
      const timestamp = new Date().toISOString()
      const id = `app-${Date.now()}-${Math.random()}`
      const application: MockApplicationRecord = {
        id,
        created_by: currentUser?.id || userId,
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

    _reinitializeMocks(): void {
      // Ensure all auth methods have implementations after mock clearing
      if (
        !mockSupabase.auth.signInWithPassword ||
        !vi.isMockFunction(mockSupabase.auth.signInWithPassword)
      ) {
        mockSupabase.auth.signInWithPassword = vi
          .fn()
          .mockResolvedValue({ data: { user: null, session: null }, error: null })
      }
      if (!mockSupabase.auth.signUp || !vi.isMockFunction(mockSupabase.auth.signUp)) {
        mockSupabase.auth.signUp = vi
          .fn()
          .mockResolvedValue({ data: { user: null, session: null }, error: null })
      }
      if (!mockSupabase.auth.signOut || !vi.isMockFunction(mockSupabase.auth.signOut)) {
        mockSupabase.auth.signOut = vi.fn().mockResolvedValue({ data: {}, error: null })
      }
      if (!mockSupabase.auth.getUser || !vi.isMockFunction(mockSupabase.auth.getUser)) {
        mockSupabase.auth.getUser = vi.fn().mockResolvedValue({ data: { user: null }, error: null })
      }
      if (!mockSupabase.auth.getSession || !vi.isMockFunction(mockSupabase.auth.getSession)) {
        mockSupabase.auth.getSession = vi
          .fn()
          .mockResolvedValue({ data: { session: null }, error: null })
      }
      // Don't override updateUser, resetPasswordForEmail, and signInWithOAuth if they already have proper implementations
      if (!mockSupabase.auth.updateUser || !vi.isMockFunction(mockSupabase.auth.updateUser)) {
        // Use proper implementation for updateUser
        mockSupabase.auth.updateUser = vi.fn().mockImplementation((args: unknown) => {
          if (!args || typeof args !== 'object') {
            return Promise.resolve({
              data: { user: null },
              error: new Error('Update parameters are required'),
            })
          }

          const params = args as { email?: string; data?: Record<string, unknown> }
          const data = params?.data || {}
          const updatedUser: MockUser = {
            id: currentUser?.id || 'mock-user-id',
            email: params?.email || currentUser?.email || 'updated@example.com',
            user_metadata: {
              name: (data.name as string) || currentUser?.user_metadata?.name || 'Test User',
              avatar_url:
                (data.avatar_url as string | null) ||
                currentUser?.user_metadata?.avatar_url ||
                null,
              bio: (data.bio as string) || currentUser?.user_metadata?.bio || 'Test bio',
            },
            created_at: currentUser?.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            email_verified: true,
          }

          if (currentUser) {
            currentUser = updatedUser
          }

          return Promise.resolve({ data: { user: updatedUser }, error: null })
        })
      }
      if (
        !mockSupabase.auth.resetPasswordForEmail ||
        !vi.isMockFunction(mockSupabase.auth.resetPasswordForEmail)
      ) {
        // Use proper implementation for resetPasswordForEmail
        mockSupabase.auth.resetPasswordForEmail = vi
          .fn()
          .mockImplementation((email: string, _options?: { redirectTo?: string }) => {
            if (!email || typeof email !== 'string') {
              return Promise.resolve({ data: {}, error: new Error('Email is required') })
            }

            if (!email.includes('@') || !email.includes('.')) {
              return Promise.resolve({ data: {}, error: new Error('Invalid email format') })
            }

            // Options are accepted but not used in mock
            return Promise.resolve({ data: {}, error: null })
          })
      }
      if (
        !mockSupabase.auth.signInWithOAuth ||
        !vi.isMockFunction(mockSupabase.auth.signInWithOAuth)
      ) {
        // Use proper implementation for signInWithOAuth
        mockSupabase.auth.signInWithOAuth = vi.fn().mockImplementation((args: unknown) => {
          const { provider, options } = args as {
            provider: string
            options?: { redirectTo?: string }
          }
          if (!provider || typeof provider !== 'string') {
            return Promise.resolve({
              data: { url: null },
              error: new Error('OAuth provider is required'),
            })
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
              return Promise.resolve({ data: { url }, error: null })
            }
            if (provider === 'invalid-provider') {
              return Promise.resolve({
                data: { url: null },
                error: new Error('Invalid OAuth provider'),
              })
            }
            return Promise.resolve({ data: { url: 'https://oauth.example.com' }, error: null })
          } catch (_error) {
            return Promise.resolve({
              data: { url: null },
              error: new Error('OAuth sign in failed'),
            })
          }
        })
      }
      if (!mockSupabase.from || !vi.isMockFunction(mockSupabase.from)) {
        mockSupabase.from = vi.fn(() => ({
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
        }))
      }
    },
  }
}
