/**
 * Application Error Classes for JobHunt
 *
 * Standardized error handling across all layers of the application
 */

// Error context and type definitions
export interface ErrorContext {
  [key: string]: unknown
}

export interface ValidationErrorContext extends ErrorContext {
  field?: string
  value?: unknown
}

export interface DuplicateRecordContext extends ErrorContext {
  resource: string
  field: string
  value: unknown
}

export interface PermissionDeniedContext extends ErrorContext {
  resource: string
  action: string
}

export interface RecordNotFoundContext extends ErrorContext {
  resource: string
  identifier?: string
}

export interface DatabaseErrorContext extends ErrorContext {
  originalError?: string
}

export interface APIErrorContext extends ErrorContext {
  resetTime?: Date
}

export interface ExternalServiceErrorContext extends ErrorContext {
  service: string
  originalError?: string
}

export interface ConfigurationErrorContext extends ErrorContext {
  field?: string
}

// Generic constructor type for error classes
export type ErrorConstructor<T extends Error = Error> = new (...args: unknown[]) => T

// Database error interface for factory method
export interface DatabaseErrorInfo {
  message?: string
  code?: string
  details?: unknown
}

// Auth error interface for factory method
export interface AuthErrorInfo {
  message?: string
  code?: string
  status?: number
}

// Base error class for all application errors
export class JobHuntError extends Error {
  public code: string
  public statusCode: number
  public isOperational: boolean
  public context?: ErrorContext

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational
    this.context = context

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor)
  }

  // Helper method to check if error is of specific type
  public isType<T extends JobHuntError>(errorType: ErrorConstructor<T>): this is T {
    return this instanceof errorType
  }

  // Convert to JSON for API responses
  public toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack }),
    }
  }
}

// Database-related errors
export class DatabaseError extends JobHuntError {
  constructor(message: string, context?: DatabaseErrorContext) {
    super(message, 'DATABASE_ERROR', 500, true, context)
  }
}

export class DatabaseConnectionError extends DatabaseError {
  constructor(originalError?: Error) {
    super('Failed to connect to the database', { originalError: originalError?.message })
    this.statusCode = 503
  }
}

export class PermissionDeniedError extends DatabaseError {
  constructor(resource: string, action: string) {
    const context: PermissionDeniedContext = { resource, action }
    super(`Permission denied: Cannot ${action} ${resource}`, context)
    this.statusCode = 403
  }
}

export class RecordNotFoundError extends DatabaseError {
  constructor(resource: string, identifier?: string) {
    const context: RecordNotFoundContext = { resource, identifier }
    super(`${resource}${identifier ? ` with identifier: ${identifier}` : ''} not found`, context)
    this.statusCode = 404
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, field?: string, value?: unknown) {
    const context: ValidationErrorContext = { field, value }
    super(`Validation failed: ${message}`, context)
    this.statusCode = 400
  }
}

export class DuplicateRecordError extends DatabaseError {
  constructor(resource: string, field: string, value: unknown) {
    const context: DuplicateRecordContext = { resource, field, value }
    super(`${resource} with ${field} '${value}' already exists`, context)
    this.statusCode = 409
  }
}

// Authentication-related errors
export class AuthenticationError extends JobHuntError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
  }
}

export class InvalidSessionError extends AuthenticationError {
  constructor() {
    super('User session is invalid or expired')
  }
}

export class UnauthorizedError extends AuthenticationError {
  constructor(resource?: string) {
    super(
      resource ? `Not authorized to access ${resource}` : 'Not authorized to perform this action'
    )
  }
}

// API-related errors
export class APIError extends JobHuntError {
  constructor(message: string, statusCode: number = 500, context?: APIErrorContext) {
    super(message, 'API_ERROR', statusCode, true, context)
  }
}

export class RateLimitError extends APIError {
  constructor(resetTime?: Date) {
    const context: APIErrorContext = { resetTime }
    super('Rate limit exceeded. Please try again later.', 429, context)
  }
}

export class NotFoundError extends APIError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404)
  }
}

export class BadRequestError extends APIError {
  constructor(message: string = 'Bad request') {
    super(message, 400)
  }
}

// External service errors
export class ExternalServiceError extends JobHuntError {
  constructor(service: string, message: string) {
    super(`${service} service error: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502, true, { service })
  }
}

export class SupabaseError extends ExternalServiceError {
  constructor(message: string, originalError?: unknown) {
    super('Supabase', message)
    const context: ExternalServiceErrorContext = {
      service: 'Supabase',
      originalError: originalError instanceof Error ? originalError.message : String(originalError),
    }
    this.context = { ...this.context, ...context }
  }
}

// Configuration errors
export class ConfigurationError extends JobHuntError {
  constructor(message: string, field?: string) {
    const context: ConfigurationErrorContext = { field }
    super(`Configuration error: ${message}`, 'CONFIGURATION_ERROR', 500, true, context)
  }
}

// Utility functions for error handling
export function isJobHuntError(error: unknown): error is JobHuntError {
  return error instanceof JobHuntError
}

export function getErrorType(error: unknown): string {
  if (isJobHuntError(error)) {
    return error.constructor.name
  }
  return 'UnknownError'
}

export function getErrorMessage(error: unknown): string {
  if (isJobHuntError(error)) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function getErrorCode(error: unknown): string {
  if (isJobHuntError(error)) {
    return error.code
  }
  return 'UNKNOWN_ERROR'
}

export function getErrorStatusCode(error: unknown): number {
  if (isJobHuntError(error)) {
    return error.statusCode
  }
  return 500
}

// Error factory for creating appropriate errors from common scenarios
export class ErrorFactory {
  static fromDatabaseError(
    error: DatabaseErrorInfo,
    context?: DatabaseErrorContext
  ): DatabaseError {
    const message = error?.message || 'Unknown database error'

    // Common Supabase error patterns
    if (message.includes('permission denied')) {
      return new PermissionDeniedError('resource', 'access')
    }

    if (message.includes('no rows returned') || message.includes('not found')) {
      return new RecordNotFoundError('record')
    }

    if (message.includes('duplicate key') || message.includes('unique constraint')) {
      return new DuplicateRecordError('record', 'field', 'value')
    }

    if (message.includes('null value') || message.includes('not-null constraint')) {
      return new ValidationError('Required field is missing')
    }

    if (message.includes('connection') || message.includes('timeout')) {
      return new DatabaseConnectionError(error instanceof Error ? error : new Error(message))
    }

    return new DatabaseError(message, context)
  }

  static fromValidationError(message: string, field?: string): ValidationError {
    return new ValidationError(message, field)
  }

  static fromAuthError(error: AuthErrorInfo): AuthenticationError {
    const message = error?.message || 'Authentication failed'

    if (message.includes('session') || message.includes('expired')) {
      return new InvalidSessionError()
    }

    if (message.includes('permission') || message.includes('unauthorized')) {
      return new UnauthorizedError()
    }

    return new AuthenticationError(message)
  }
}
