/**
 * E2E Test Type Definitions
 *
 * Provides proper typing for end-to-end tests without using any types
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import type { ApplicationStatus } from '@/lib/types/database.types'

/**
 * Test database interface
 */
export interface TestDatabase {
  supabase: SupabaseClient
  reset(): Promise<void>
}

/**
 * Test user profile structure
 */
export interface TestUserProfile {
  id: string
  email: string
  name: string
  avatar_url?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  created_at: string
  updated_at: string
}

/**
 * Complete test user structure (simplified for E2E tests)
 */
export interface TestUser {
  profile: TestUserProfile
  // Simplified session structure for test compatibility
  session?: {
    access_token: string
    refresh_token: string
    expires_at: number
    user: User
  }
}

/**
 * Test application creation options
 */
export interface TestApplicationOptions {
  company_name: string
  job_title?: string
  status?: ApplicationStatus
  location?: string
  description?: string
  salary_min?: number
  salary_max?: number
  url?: string
  notes?: string
  job_description?: string
  salary_range?: string
}

/**
 * Test user creation options
 */
export interface TestUserOptions {
  email?: string
  name?: string
  avatar_url?: string | null
  user_metadata?: Record<string, unknown>
}

/**
 * Mock storage interface for testing
 */
export interface MockStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  clear: () => void
  length: number
  key: (index: number) => string | null
}

/**
 * Error handling test types
 */
export interface QuotaExceededError extends Error {
  name: 'QuotaExceededError'
}

export interface SessionStorageUnavailableError extends Error {
  message: 'SessionStorage unavailable'
}

/**
 * Network error simulation type
 */
export interface NetworkError extends Error {
  message: string
}

/**
 * Performance test metrics
 */
export interface PerformanceMetrics {
  createTime: number
  queryTime: number
  paginationTime: number
}

/**
 * Export data structure
 */
export interface ApplicationExportData {
  id: string
  company_name: string
  job_title: string
  status: ApplicationStatus
  location: string
  salary_min: number | null
  salary_max: number | null
  url: string | null
  created_at: string
  updated_at: string
}

/**
 * Analytics data structures
 */
export interface StatusDistribution {
  [status: string]: number
}

export interface SalaryStatistics {
  total: number
  count: number
  min: number
  max: number
}

export interface TimelineData {
  created_at: string
  status: ApplicationStatus
}
