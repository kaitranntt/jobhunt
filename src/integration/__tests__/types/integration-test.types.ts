/**
 * Integration Test Types
 *
 * Comprehensive type definitions for integration tests.
 * These types provide strict typing for all integration test scenarios.
 */

import type {
  Application,
  Company,
  ApplicationStatus,
  ApplicationInsert,
  ApplicationUpdate,
  CompanyInsert,
} from '@/lib/types/database.types'

// Re-export types that are needed by other modules
export type { ApplicationInsert, CompanyInsert, ApplicationStatus }
import type { SupabaseClient } from '@supabase/supabase-js'

// ============================================================================
// Database Types
// ============================================================================

export interface TestUser {
  auth: {
    id: string
    email: string
    user_metadata: {
      name: string
      avatar_url?: string | null
      bio?: string
    }
    created_at: string
    updated_at: string
    email_verified?: boolean
  }
  profile: {
    id: string
    email: string
    name: string
    avatar_url?: string | null
    bio?: string
    created_at: string
    updated_at: string
  }
}

export interface TestApplication extends Omit<Application, 'user_id'> {
  created_by: string
}

export interface TestApplicationActivity {
  id: string
  application_id: string
  type:
    | 'status_change'
    | 'note_added'
    | 'interview_scheduled'
    | 'document_uploaded'
    | 'reminder_set'
  description: string
  old_value?: string | null
  new_value?: string | null
  interview_date?: string | null
  created_by: string
  created_at: string
}

export interface TestCompany extends Company {
  created_by: string
}

export interface TestDatabase {
  supabase: SupabaseClient
  supabaseUrl: string
  supabaseKey: string
  serviceRoleKey: string
  reset: () => Promise<void>
  cleanup: () => Promise<void>
  createUser: (userData?: Partial<TestUserCreationData>) => Promise<TestUser>
  createTestUser: (userData?: Partial<TestUserCreationData>) => Promise<TestUser>
  createTestApplication: (
    userId: string,
    appData?: Partial<ApplicationInsert>
  ) => Promise<TestApplication>
  createTestCompany: (companyData?: Partial<CompanyInsert>) => Promise<TestCompany>
  _reinitializeMocks?: () => void
}

export interface TestUserCreationData {
  email?: string
  password?: string
  name?: string
  avatar_url?: string | null
  user_metadata?: {
    name?: string
    avatar_url?: string | null
    bio?: string
  }
}

// ============================================================================
// API Response Types
// ============================================================================

export interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
  count?: number
  status: number
  statusText: string
}

export interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  error: SupabaseError | null
  count?: number
  status: number
  statusText: string
}

// ============================================================================
// Application API Types
// ============================================================================

export interface ApplicationCreationData extends ApplicationInsert {
  created_by: string
  created_at: string
  updated_at: string
}

export interface ApplicationUpdateData extends ApplicationUpdate {
  updated_at: string
}

export interface ApplicationSearchParams {
  status?: ApplicationStatus
  company_search?: string
  title_search?: string
  limit?: number
  offset?: number
  order_by?: string
  ascending?: boolean
}

// ============================================================================
// Company API Types
// ============================================================================

export interface CompanyCreationData extends CompanyInsert {
  created_at: string
  updated_at: string
}

export interface CompanySearchParams {
  name_search?: string
  industry?: string
  limit?: number
  offset?: number
}

// ============================================================================
// User Profile API Types
// ============================================================================

export interface UserProfileUpdateData {
  name?: string
  bio?: string
  avatar_url?: string
  updated_at: string
}

// ============================================================================
// Activity API Types
// ============================================================================

export interface ActivityCreationData {
  application_id: string
  type: TestApplicationActivity['type']
  description: string
  interview_date?: string
  created_by: string
  created_at: string
}

// ============================================================================
// Storage API Types
// ============================================================================

export interface FileUploadData {
  file: File
  path: string
  bucket?: string
}

export interface FileUploadResponse {
  data: {
    id: string
    path: string
    fullPath: string
  } | null
  error: SupabaseError | null
}

export interface FileDeleteResponse {
  data: { success: boolean } | null
  error: SupabaseError | null
}

export interface PublicUrlResponse {
  data: {
    publicUrl: string
  } | null
  error: SupabaseError | null
}

// ============================================================================
// Authentication Types
// ============================================================================

export interface UserRegistrationData {
  email: string
  password: string
  options?: {
    data?: {
      name?: string
      avatar_url?: string | null
    }
  }
}

export interface UserLoginData {
  email: string
  password: string
}

export interface PasswordResetData {
  email: string
  redirectTo?: string
}

export interface UserMetadataUpdate {
  data?: {
    name?: string
    avatar_url?: string | null
    bio?: string
  }
  email?: string
  password?: string
}

// ============================================================================
// Realtime Types
// ============================================================================

export interface RealtimeEventPayload {
  id: string
  [key: string]: unknown
}

export interface RealtimeSubscription {
  subscribe: (
    event: string,
    schema: string,
    table: string,
    callback: (payload: RealtimeEventPayload) => void,
    filter?: string
  ) => string
  unsubscribe: (subscriptionId: string) => void
}

export interface RealtimeHarness {
  connect: () => Promise<void>
  disconnect: () => void
  subscribe: (
    event: string,
    schema: string,
    table: string,
    callback: (payload: RealtimeEventPayload) => void,
    filter?: string
  ) => string
  unsubscribe: (subscriptionId: string) => void
  getConnectionStatus: () => boolean
  getSubscriptionCount: () => number
  assertSubscriptionExists: (subscriptionId: string) => boolean
  clearEvents: () => void
  simulateDisconnection: () => void
  simulateReconnection: () => Promise<void>
  simulateEvent: (event: {
    event: string
    schema: string
    table: string
    payload: RealtimeEventPayload | null
  }) => void
}

export interface RealtimeTestHarness extends RealtimeHarness {
  subscriptions: Map<string, unknown>
  eventQueue: unknown[]
  isConnected: boolean
  reconnectAttempts: number
  maxReconnectAttempts: number
  getActiveSubscriptions: () => unknown[]
  getEventCount: () => number
  getEvents: () => unknown[]
  waitForEvent: (eventType: string, timeoutMs?: number) => Promise<unknown>
  assertEventReceived: (eventType: string, schema: string, table: string) => boolean
  simulateDatabaseInsert: (table: string, data: Record<string, unknown>) => void
  simulateDatabaseUpdate: (table: string, id: string, data: Record<string, unknown>) => void
  simulateDatabaseDelete: (table: string, id: string, oldData?: Record<string, unknown>) => void
}

// ============================================================================
// Performance Test Types
// ============================================================================

export interface PerformanceMetrics {
  createDuration: number
  queryDuration: number
  totalCount: number
  duration: number
}

export interface PerformanceThresholds {
  maxCreateTime: number
  maxQueryTime: number
  maxFilteredQueryTime: number
}

// ============================================================================
// Test Utility Types
// ============================================================================

export interface TestEnvironment {
  testDatabase: TestDatabase
  testStorage: TestStorage
  testRealtimeHarness?: RealtimeHarness
}

export interface TestStorage {
  clearAllStorage: () => void
}

export interface MockSupabaseStorage {
  upload: (path: string, file: File, options?: unknown) => Promise<FileUploadResponse>
  getPublicUrl: (path: string) => Promise<PublicUrlResponse>
  remove: (paths: string[]) => Promise<FileDeleteResponse>
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface ConcurrencyTestResult {
  status: 'fulfilled' | 'rejected'
  value?: {
    data: unknown
    error: null
  }
  reason?: {
    data: null
    error: SupabaseError
  }
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// ============================================================================
// Security Test Types
// ============================================================================

export interface SecurityTestScenario {
  maliciousData: Record<string, unknown>
  expectedResult: 'success' | 'error'
  expectedErrorType?: string
}

export interface RLSTestResult {
  authorizedAccess: boolean
  dataReturned: boolean
  error?: SupabaseError
}

// ============================================================================
// Test Configuration Types
// ============================================================================

export interface IntegrationTestConfig {
  database: {
    url: string
    anonKey: string
    serviceRoleKey: string
  }
  storage: {
    bucket: string
    maxSize: number
    allowedTypes: string[]
  }
  auth: {
    autoConfirm: boolean
    testUsers: TestUserCreationData[]
  }
}

// ============================================================================
// Global Test Extensions
// ============================================================================

declare global {
  var testUtils: {
    getTestDatabase: () => TestDatabase
    getPerformanceMonitor: () => any
    createTestUser: (userData?: Partial<TestUserCreationData>) => Promise<TestUser>
    createTestApplication: (
      userId: string,
      appData?: Partial<ApplicationInsert>
    ) => Promise<TestApplication>
    createTestCompany: (companyData?: Partial<CompanyInsert>) => Promise<TestCompany>
    wait: (ms: number) => Promise<void>
    measureTime: <T>(fn: () => Promise<T>) => Promise<{ result: T; duration: number }>
  }

  var testStorage: {
    getLocalStorage: () => Record<string, string>
    getSessionStorage: () => Record<string, string>
    setLocalStorage: (store: Record<string, string>) => void
    setSessionStorage: (store: Record<string, string>) => void
    clearAllStorage: () => void
    simulateSessionStorageQuotaExceeded: () => void
    getObjectURLs: () => string[]
    clearObjectURLs: () => void
  } & TestStorage

  var testRealtimeHarness: RealtimeTestHarness & {
    connect: () => Promise<void>
    disconnect: () => Promise<void>
    subscribe: (
      event: string,
      schema: string,
      table: string,
      callback: (payload: RealtimeEventPayload) => void,
      filter?: string
    ) => string
    unsubscribe: (subscriptionId: string) => void
    getConnectionStatus: () => boolean
    getSubscriptionCount: () => number
    assertSubscriptionExists: (subscriptionId: string) => boolean
    clearEvents: () => void
    simulateDisconnection: () => void
    simulateReconnection: () => Promise<void>
    simulateEvent: (event: {
      event: string
      schema: string
      table: string
      payload: Record<string, unknown>
    }) => void
    simulateDatabaseInsert: (table: string, data: Record<string, unknown>) => void
    simulateDatabaseUpdate: (table: string, id: string, data: Record<string, unknown>) => void
    simulateDatabaseDelete: (table: string, id: string, oldData?: Record<string, unknown>) => void
  }
}
