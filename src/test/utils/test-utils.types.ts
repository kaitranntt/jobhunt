/**
 * Test Utility Types
 *
 * Comprehensive type definitions for test utilities to eliminate any types
 * and provide strict typing for all mock objects and test scenarios.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { MockedFunction } from 'vitest'
import type {
  TestUser,
  TestUserCreationData,
  TestApplication,
  TestCompany,
} from '@/integration/__tests__/types/integration-test.types'

// Re-export vi types for compatibility
type MockedFunctionType = MockedFunction<any>

// ============================================================================
// Mock Supabase Types
// ============================================================================

export interface MockUser {
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

export interface MockSession {
  access_token: string
  refresh_token?: string
  expires_at?: number
  user: MockUser
}

export interface MockAuthUser {
  email: string
  password: string
}

// ============================================================================
// Database Record Types
// ============================================================================

export interface MockDatabaseRecord {
  id: string
  created_at: string
  updated_at: string
  created_by?: string
  company_id?: string
  companies?: MockCompanyRecord
  application_activities?: MockApplicationActivityRecord[]
  [key: string]: unknown
}

export interface MockApplicationRecord extends MockDatabaseRecord {
  created_by: string
  company_name: string
  job_title: string
  status: string
  description?: string
  notes?: string
  location?: string
  salary_min?: number
  salary_max?: number
  url?: string
  deadline?: string
  company_id?: string
}

export interface MockCompanyRecord extends MockDatabaseRecord {
  name: string
  description?: string
  industry?: string
  size?: string
  website?: string
  logo_url?: string | null
  created_by?: string
}

export interface MockJobRecord extends MockDatabaseRecord {
  title: string
  description?: string
  requirements?: string
  responsibilities?: string
  location?: string
  type?: string
  salary_min?: number
  salary_max?: number
  is_active?: boolean
}

export interface MockUserProfileRecord extends MockDatabaseRecord {
  id: string
  email: string
  name: string
  avatar_url?: string | null
  bio?: string
}

export interface MockApplicationActivityRecord extends MockDatabaseRecord {
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
}

// ============================================================================
// Mock Query Builder Types
// ============================================================================

export type MockQueryValue = string | number | boolean | null | undefined

export interface MockQueryBuilder {
  select: (columns?: string) => MockQueryBuilder
  insert: (data: MockDatabaseRecord | MockDatabaseRecord[]) => MockQueryBuilder
  update: (data: Partial<MockDatabaseRecord>) => MockQueryBuilder
  delete: () => MockQueryBuilder
  eq: (column: string, value: MockQueryValue) => MockQueryBuilder
  order: (column: string, options?: { ascending?: boolean }) => MockQueryBuilder
  range: (from: number, to: number) => MockQueryBuilder
  limit: (count: number) => MockQueryBuilder
  ilike: (column: string, value: string) => MockQueryBuilder
  in: (column: string, values: MockQueryValue[]) => MockQueryBuilder
  gte: (column: string, value: MockQueryValue) => MockQueryBuilder
  lte: (column: string, value: MockQueryValue) => MockQueryBuilder
  or: (query: string) => MockQueryBuilder
  not: (column: string, operator: string, value: MockQueryValue) => MockQueryBuilder
  single: () => MockQueryBuilder
  then: <T>(resolve: (value: T) => void, reject?: (reason: unknown) => void) => Promise<T>
}

export interface MockSupabaseClient {
  auth: {
    signInWithPassword: MockedFunctionType
    signUp: MockedFunctionType
    signOut: MockedFunctionType
    getUser: MockedFunctionType
    getSession: MockedFunctionType
    updateUser: MockedFunctionType
    resetPasswordForEmail: MockedFunctionType
    signInWithOAuth: MockedFunctionType
    onAuthStateChange: MockedFunctionType
    admin: {
      createUser: MockedFunctionType
    }
    _clearAuthState?: MockedFunctionType
  }
  from: (table: string) => MockQueryBuilder
  rpc: MockedFunctionType
  storage: {
    from: MockedFunctionType
  }
}

// ============================================================================
// Performance Monitor Types
// ============================================================================

export interface PerformanceMonitor {
  startMonitoring: (intervalMs: number) => void
  stopMonitoring: () => void
  getMetrics: () => PerformanceMetrics[]
  getAlerts: () => PerformanceAlert[]
  getReport: () => PerformanceReport
  reset: () => void
  cleanup: () => void
}

export interface PerformanceMetrics {
  timestamp: number
  queryTime: number
  connectionPoolUsage: number
  memoryUsage: number
  cacheHitRate: number
}

export interface PerformanceThresholds {
  maxQueryTime: number
  minCacheHitRate: number
  maxConnectionPoolUsage: number
  maxMemoryGrowth: number
}

export interface PerformanceAlert {
  type: 'query_time' | 'memory_usage' | 'connection_pool' | 'cache_hit_rate' | 'error_rate'
  message: string
  threshold: number
  actual: number
  timestamp: number
  value: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export interface PerformanceReport {
  metrics: PerformanceMetrics[]
  alerts: PerformanceAlert[]
  summary: {
    totalMetrics: number
    totalAlerts: number
    monitoringDuration: number
    averageQueryTime: number
    averageCacheHitRate: number
    averageConnectionPoolUsage: number
    memoryGrowth: number
  }
  thresholds: PerformanceThresholds
}

// ============================================================================
// Realtime Event Types
// ============================================================================

export interface RealtimeEventPayload {
  [key: string]: unknown
}

export interface RealtimeEventObject {
  event: string
  schema: string
  table: string
  payload: RealtimeEventPayload
}

// ============================================================================
// Test Database Interface Extension
// ============================================================================

export interface StrictTestDatabase {
  supabase: MockSupabaseClient | SupabaseClient
  supabaseUrl: string
  supabaseKey: string
  serviceRoleKey: string
  reset: () => Promise<void>
  cleanup: () => Promise<void>
  createUser: (userData?: Partial<TestUserCreationData>) => Promise<TestUser>
  createApplication: (
    userId: string,
    appData?: Partial<MockApplicationRecord>
  ) => Promise<TestApplication>
  createCompany: (companyData?: Partial<MockCompanyRecord>) => Promise<TestCompany>
  createJob: (jobData?: Partial<MockJobRecord>) => Promise<MockJobRecord>
  _reinitializeMocks?: () => void
}

// ============================================================================
// Global Test Utils Interface
// ============================================================================

export interface StrictGlobalTestUtils {
  getTestDatabase: () => StrictTestDatabase
  getPerformanceMonitor: () => PerformanceMonitor
  createTestUser: (userData?: Partial<TestUserCreationData>) => Promise<TestUser>
  createTestApplication: (
    userId: string,
    appData?: Partial<MockApplicationRecord>
  ) => Promise<TestApplication>
  createTestCompany: (companyData?: Partial<MockCompanyRecord>) => Promise<TestCompany>
  wait: (ms: number) => Promise<void>
  measureTime: <T>(fn: () => Promise<T>) => Promise<{ result: T; duration: number }>
}

// ============================================================================
// Mock Data Storage Types
// ============================================================================

export interface MockDataStorage {
  users: Map<string, MockUser>
  user_profiles: Map<string, MockUserProfileRecord>
  applications: Map<string, MockApplicationRecord>
  companies: Map<string, MockCompanyRecord>
  application_activities: Map<string, MockApplicationActivityRecord>
  jobs: Map<string, MockJobRecord>
}
