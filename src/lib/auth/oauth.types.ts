/**
 * OAuth Type Definitions
 * Type definitions for OAuth authentication and error handling
 */

export interface OAuthError {
  message?: string
  code?: string
  error?: string
  error_description?: string
  status?: number
}

export interface SupabaseAuthError extends OAuthError {
  message: string
  status: number
}

export interface OAuthProviderError extends OAuthError {
  error: string
  error_description?: string
}

export interface NetworkError extends OAuthError {
  message: string
  code?: string
  status?: number
}

export type OAuthErrorType =
  | SupabaseAuthError
  | OAuthProviderError
  | NetworkError
  | Error
  | { message?: string; [key: string]: unknown }

export interface OAuthDebugConfig {
  supabaseUrl?: string
  siteUrl?: string
  supabaseAnonKey?: string
  nodeEnv?: string
}

export interface CallbackUrlConfig {
  allowed: string[]
  missing: string[]
}
