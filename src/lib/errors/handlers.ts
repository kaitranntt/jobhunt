/**
 * Error Handling Utilities and Middleware
 *
 * Centralized error handling for different contexts (API, Server Actions, Client)
 */

import { NextResponse } from 'next/server'
import {
  JobHuntError,
  isJobHuntError,
  getErrorMessage,
  getErrorCode,
  getErrorStatusCode,
  ErrorFactory,
  PermissionDeniedError,
  DuplicateRecordError,
  ValidationError,
  DatabaseConnectionError,
  DatabaseError,
  RecordNotFoundError,
} from './index'
import type {
  ErrorContext,
  AsyncFunction,
  ErrorHandlingOptions,
  SupabaseError,
  ZodValidationError,
} from './types'

/**
 * Enhanced error logger with structured logging
 */
export class ErrorLogger {
  static log(error: unknown, context?: ErrorContext): void {
    const timestamp = new Date().toISOString()
    const errorInfo = {
      timestamp,
      message: getErrorMessage(error),
      code: getErrorCode(error),
      statusCode: getErrorStatusCode(error),
      context,
      ...(isJobHuntError(error) && error.context && { errorContext: error.context }),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error instanceof Error ? error.stack : undefined,
      }),
    }

    // Console output for development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ERROR]', JSON.stringify(errorInfo, null, 2))
    } else {
      // Production logging (can be extended to external logging services)
      console.error(
        '[ERROR]',
        JSON.stringify({
          timestamp,
          message: errorInfo.message,
          code: errorInfo.code,
          statusCode: errorInfo.statusCode,
          context,
        })
      )
    }
  }

  static logWithLevel(
    level: 'error' | 'warn' | 'info' | 'debug',
    message: string,
    context?: ErrorContext
  ): void {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      context,
    }

    if (process.env.NODE_ENV === 'development') {
      console[level](`[${level.toUpperCase()}]`, JSON.stringify(logEntry, null, 2))
    } else {
      console[level](`[${level.toUpperCase()}]`, message, context ? JSON.stringify(context) : '')
    }
  }
}

/**
 * Wrap async functions with consistent error handling
 */
export function withErrorHandling<T extends unknown[], R>(
  fn: AsyncFunction<T, R>,
  options?: ErrorHandlingOptions
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      ErrorLogger.log(error, { ...options?.context, function: fn.name, args })

      if (options?.rethrow) {
        throw error
      }

      // Convert non-JobHunt errors to JobHunt errors
      if (!isJobHuntError(error)) {
        if (error instanceof Error) {
          throw new JobHuntError(error.message, 'UNKNOWN_ERROR', 500, true)
        }
        throw new JobHuntError(String(error), 'UNKNOWN_ERROR', 500, true)
      }

      throw error
    }
  }
}

/**
 * API Route error handler middleware
 */
export function handleAPIRouteError(error: unknown): NextResponse {
  ErrorLogger.log(error, { type: 'api_route' })

  if (isJobHuntError(error)) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
          code: error.code,
          ...(process.env.NODE_ENV === 'development' && {
            context: error.context,
            stack: error.stack,
          }),
        },
      },
      { status: error.statusCode }
    )
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        ...(process.env.NODE_ENV === 'development' && {
          originalError: getErrorMessage(error),
          stack: error instanceof Error ? error.stack : undefined,
        }),
      },
    },
    { status: 500 }
  )
}

/**
 * Server Action error handler
 */
export function handleServerActionError(error: unknown): never {
  ErrorLogger.log(error, { type: 'server_action' })

  if (isJobHuntError(error)) {
    throw error
  }

  // Convert unknown errors to JobHunt errors
  if (error instanceof Error) {
    throw new JobHuntError(error.message, 'UNKNOWN_ERROR', 500, true)
  }

  throw new JobHuntError(String(error), 'UNKNOWN_ERROR', 500, true)
}

/**
 * Client-side error boundary support
 */
export interface ClientErrorInfo {
  message: string
  code: string
  statusCode?: number
  context?: Record<string, any>
}

export function formatClientError(error: unknown): ClientErrorInfo {
  if (isJobHuntError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
    }
  }

  return {
    message: getErrorMessage(error),
    code: getErrorCode(error),
    statusCode: getErrorStatusCode(error),
  }
}

/**
 * Retry mechanism for transient errors
 */
export interface RetryOptions {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableErrors?: string[]
}

const defaultRetryOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  retryableErrors: ['DATABASE_ERROR', 'EXTERNAL_SERVICE_ERROR', 'TIMEOUT_ERROR'],
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options }
  let lastError: unknown

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on the last attempt
      if (attempt === opts.maxAttempts) {
        break
      }

      // Check if error is retryable
      if (!isJobHuntError(error) || !opts.retryableErrors!.includes(error.code)) {
        break
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.baseDelay * Math.pow(opts.backoffFactor, attempt - 1),
        opts.maxDelay
      )

      ErrorLogger.logWithLevel('warn', `Attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: getErrorMessage(error),
        attempt,
        maxAttempts: opts.maxAttempts,
      })

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  ErrorLogger.log(lastError, { type: 'retry_failed', attempts: opts.maxAttempts })
  throw lastError
}

/**
 * Circuit breaker pattern for handling failing services
 */
export interface CircuitBreakerOptions {
  failureThreshold: number
  resetTimeout: number
  monitoringPeriod: number
}

export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime = 0
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = 'HALF_OPEN'
        ErrorLogger.logWithLevel('info', 'Circuit breaker entering HALF_OPEN state')
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable')
      }
    }

    try {
      const result = await fn()

      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failureCount = 0
        ErrorLogger.logWithLevel('info', 'Circuit breaker reset to CLOSED state')
      }

      return result
    } catch (error) {
      this.failureCount++
      this.lastFailureTime = Date.now()

      if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'OPEN'
        ErrorLogger.logWithLevel('error', 'Circuit breaker opened due to failure threshold', {
          failureCount: this.failureCount,
          threshold: this.options.failureThreshold,
        })
      }

      throw error
    }
  }

  getState(): string {
    return this.state
  }

  getFailureCount(): number {
    return this.failureCount
  }
}

/**
 * Database error transformation utilities
 */
export function transformSupabaseError(error: SupabaseError | unknown): JobHuntError {
  if (!error) {
    return new DatabaseError('Unknown error occurred')
  }

  const code = (error as SupabaseError).code
  const details = (error as SupabaseError).details

  // Handle specific Supabase/PostgreSQL error codes
  switch (code) {
    case 'PGRST116': // No rows returned
      return new RecordNotFoundError('record')

    case 'PGRST301': // Permission denied
      return new PermissionDeniedError('resource', 'access')

    case '23505': // Unique violation
      return new DuplicateRecordError('record', 'field', 'value')

    case '23502': // Not null violation
      return new ValidationError('Required field is missing', details?.column)

    case '23503': // Foreign key violation
      return new ValidationError('Referenced record does not exist', details?.column)

    case '23514': // Check constraint violation
      return new ValidationError('Invalid data format', details?.constraint)

    case '08006': // Connection failure
    case '08001': // SQL client unable to establish connection
      return new DatabaseConnectionError(error as Error)

    case '08003': // Connection does not exist
      return new DatabaseConnectionError(error as Error)

    default:
      return ErrorFactory.fromDatabaseError(error, { pgCode: code, details })
  }
}

/**
 * Validation error handling for Zod schemas
 */
export function handleZodError(error: ZodValidationError | unknown): ValidationError {
  const zodError = error as ZodValidationError
  if (zodError.errors && Array.isArray(zodError.errors)) {
    const firstError = zodError.errors[0]
    return new ValidationError(
      `${firstError.path.join('.')}: ${firstError.message}`,
      firstError.path.join('.'),
      firstError.received
    )
  }

  return new ValidationError(zodError.message || 'Validation failed')
}
