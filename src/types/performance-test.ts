/**
 * Performance Test Types
 *
 * Type definitions for performance testing infrastructure,
 * benchmarks, and monitoring utilities.
 */

import type { MockSupabaseClient, MockUser } from '@/types/test'
import type { ApplicationStatus } from '@/lib/types/database.types'

// Performance Test Database Interface
export interface PerformanceTestDatabase {
  supabase: MockSupabaseClient
  reset(): Promise<void>
}

// Performance Monitor Interface
export interface PerformanceMonitor {
  startMeasurement(name: string): void
  endMeasurement(name: string): void
  reset(): void
  getReport(): PerformanceReport
}

// Performance Test User Interface
export interface PerformanceTestUser {
  profile: MockUser
}

// Application Interface for Performance Testing
export interface PerformanceApplication {
  id: string
  company_name: string
  job_title?: string
  job_url?: string
  location?: string
  salary_range?: string
  job_description?: string
  source: string
  status: ApplicationStatus
  date_applied?: string
  notes?: string
  created_by: string
  created_at: string
  updated_at: string
}

// Company Interface for Performance Testing
export interface PerformanceCompany {
  id: string
  name: string
  website?: string
  logo_url?: string
  industry?: string
  created_by: string
  created_at: string
  updated_at: string
}

// Performance Measurement Result
export interface PerformanceMeasurementResult<T> {
  result: T
  duration: number
}

// Pagination Test Configuration
export interface PaginationTestConfig {
  page: number
  limit: number
  expectedMaxTime: number
}

// Search Test Configuration
export interface SearchTestConfig {
  name: string
  operation: () => Promise<MockSupabaseResponse<PerformanceApplication[]>>
  expectedMaxTime: number
}

// Batch Operation Test Data
export interface BatchApplicationData {
  company_name: string
  job_title: string
  status: ApplicationStatus
  created_by: string
  created_at: string
  updated_at: string
}

// Application Creation Data
export interface ApplicationCreationData {
  company_name: string
  job_title?: string
  status?: ApplicationStatus
  description?: string
  location?: string
  salary_min?: number
  salary_max?: number
  notes?: string
  requirements?: string
  responsibilities?: string
  benefits?: string
  job_description?: string
}

// Company Creation Data
export interface CompanyCreationData {
  name: string
  description?: string
  industry?: string
  size?: string
  website?: string
}

// User Profile Update Data
export interface UserProfileUpdateData {
  name?: string
  bio?: string
  updated_at: string
}

// Performance Test Operation
export interface PerformanceTestOperation<T> {
  name: string
  threshold: number
  operation: () => Promise<T>
}

// Large Payload Data
export interface LargePayloadData extends ApplicationCreationData {
  description: string
  notes: string
  requirements: string
  responsibilities: string
  benefits: string
}

// Memory Report Interface
export interface MemoryReport {
  growth?: number
  usage?: number
  timestamp: number
}

// Performance Report Interface
export interface PerformanceReport {
  memory?: MemoryReport
  measurements?: Record<string, PerformanceMeasurement>
  timestamp: number
}

// Performance Measurement Interface
export interface PerformanceMeasurement {
  duration: number
  memory?: number
  timestamp: number
}

// Mock Supabase Response Interface (re-export for convenience)
export interface MockSupabaseResponse<T> {
  data: T | null
  error: {
    message: string
    code?: string
    details?: Record<string, unknown>
  } | null
  count?: number
  status: number
  statusText: string
}

// Critical Path Performance Test
export interface CriticalPathTest {
  name: string
  threshold: number
  operation: () => Promise<void>
}

// Performance Test Utilities Interface
export interface PerformanceTestUtils {
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<PerformanceMeasurementResult<T>>
  assertPerformanceThreshold(name: string, threshold: number): void
  assertMemoryThreshold(threshold: number): void
  takeMemorySnapshot(): void
  getPerformanceReport(): PerformanceReport
}

// Global Test Context Interface
export interface GlobalTestContext {
  testUtils: {
    getTestDatabase(): PerformanceTestDatabase
    createTestUser(userId?: string): Promise<PerformanceTestUser>
    createTestApplication(
      userId: string,
      overrides?: Partial<ApplicationCreationData>
    ): Promise<PerformanceApplication>
    createTestCompany(
      userId?: string,
      overrides?: Partial<CompanyCreationData>
    ): Promise<PerformanceCompany>
  }
  performanceTestSuite: PerformanceMonitor
  performanceUtils: PerformanceTestUtils
}
