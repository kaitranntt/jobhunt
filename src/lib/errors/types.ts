/**
 * Error Handler Type Definitions
 *
 * Provides proper typing for error handling without using any types
 */

/**
 * Error logging context structure
 */
export interface ErrorContext {
  [key: string]: unknown
}

/**
 * Structured error information for logging
 */
export interface ErrorLogInfo {
  timestamp: string
  message: string
  code: string
  statusCode: number | undefined
  context?: ErrorContext
  errorContext?: ErrorContext
  stack?: string
}

/**
 * Log entry structure for different log levels
 */
export interface LogEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  context?: ErrorContext
}

/**
 * Supabase error structure
 */
export interface SupabaseError {
  code?: string
  message: string
  details?: {
    column?: string
    constraint?: string
    table?: string
  }
  hint?: string
}

/**
 * Zod validation error structure
 */
export interface ZodValidationError {
  errors: Array<{
    path: string[]
    message: string
    received?: unknown
    expected?: unknown
  }>
  message?: string
}

/**
 * Database error details from Postgres
 */
export interface PostgresErrorDetails {
  column?: string
  constraint?: string
  table?: string
  schema?: string
  detail?: string
}

/**
 * Error transformation options
 */
export interface ErrorTransformationOptions {
  pgCode?: string
  details?: PostgresErrorDetails
  originalError?: unknown
}

/**
 * Error handler function types
 */
export type AsyncFunction<T extends unknown[] = unknown[], R = unknown> = (...args: T) => Promise<R>

export type ErrorHandlingOptions = {
  rethrow?: boolean
  context?: ErrorContext
}

/**
 * Circuit breaker state types
 */
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
}
