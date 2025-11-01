/**
 * API Response Types
 *
 * Comprehensive type definitions for API requests, responses,
 * error handling, and data transfer objects.
 */

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  message?: string
  meta?: ResponseMeta
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
  timestamp: number
  requestId?: string
  stack?: string // Only in development
}

export interface ResponseMeta {
  pagination?: PaginationMeta
  requestId: string
  timestamp: number
  version: string
  rateLimit?: RateLimitMeta
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface RateLimitMeta {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & {
    pagination: PaginationMeta
  }
}

// Application API Types
export interface CreateApplicationRequest {
  company_name: string
  job_title: string
  job_url?: string
  location?: string
  salary_range?: string
  job_description?: string
  source: string
  status: ApplicationStatus
  notes?: string
}

export interface UpdateApplicationRequest {
  company_name?: string
  job_title?: string
  job_url?: string
  location?: string
  salary_range?: string
  job_description?: string
  status?: ApplicationStatus
  notes?: string
}

export interface ApplicationResponse {
  id: string
  user_id: string
  company_id?: string
  company_name: string
  job_title: string
  job_url?: string
  location?: string
  salary_range?: string
  job_description?: string
  company_logo_url?: string
  source: string
  status: ApplicationStatus
  date_applied?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ApplicationListQuery {
  page?: number
  limit?: number
  status?: ApplicationStatus
  company?: string
  search?: string
  sort?: 'created_at' | 'updated_at' | 'company_name' | 'job_title'
  order?: 'asc' | 'desc'
  date_from?: string
  date_to?: string
}

// Company API Types
export interface CreateCompanyRequest {
  name: string
  website?: string
  logo_url?: string
  industry?: string
}

export interface UpdateCompanyRequest {
  name?: string
  website?: string
  logo_url?: string
  industry?: string
}

export interface CompanyResponse {
  id: string
  user_id: string
  name: string
  website?: string
  logo_url?: string
  industry?: string
  created_at: string
  updated_at: string
}

export interface CompanyListQuery {
  page?: number
  limit?: number
  search?: string
  industry?: string
  sort?: 'name' | 'created_at'
  order?: 'asc' | 'desc'
}

// Auth API Types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name?: string
}

export interface AuthResponse {
  user: User
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
    user: User
  }
}

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
  email_verified?: boolean
}

// Search API Types
export interface SearchQuery {
  query: string
  type?: 'applications' | 'companies' | 'all'
  page?: number
  limit?: number
  filters?: Record<string, unknown>
}

export interface SearchResult<T> {
  item: T
  score: number
  highlights: string[]
}

export interface SearchResponse<T = unknown> {
  results: SearchResult<T>[]
  total: number
  query: string
  took: number
}

// File Upload API Types
export interface UploadRequest {
  file: File
  type: 'logo' | 'resume' | 'attachment'
  metadata?: Record<string, unknown>
}

export interface UploadResponse {
  url: string
  name: string
  size: number
  type: string
  metadata?: Record<string, unknown>
}

// Analytics API Types
export interface AnalyticsQuery {
  metric: string
  period: string
  date_from?: string
  date_to?: string
  group_by?: string
  filters?: Record<string, unknown>
}

export interface AnalyticsDataPoint {
  date: string
  value: number
  label?: string
}

export interface AnalyticsResponse {
  metric: string
  period: string
  data: AnalyticsDataPoint[]
  total: number
  average: number
  trend: {
    direction: 'up' | 'down' | 'stable'
    percentage: number
  }
}

// Webhook API Types
export interface WebhookEvent {
  id: string
  type: string
  data: Record<string, unknown>
  timestamp: number
  signature?: string
}

export interface WebhookConfig {
  url: string
  events: string[]
  secret?: string
  active: boolean
}

// Import/Export API Types
export interface ExportQuery {
  format: 'json' | 'csv' | 'xlsx'
  type: 'applications' | 'companies' | 'all'
  filters?: Record<string, unknown>
  fields?: string[]
}

export interface ImportRequest {
  file: File
  format: 'json' | 'csv' | 'xlsx'
  type: 'applications' | 'companies'
  options?: {
    skipDuplicates?: boolean
    updateExisting?: boolean
    mapping?: Record<string, string>
  }
}

export interface ImportResponse {
  processed: number
  created: number
  updated: number
  errors: ImportError[]
}

export interface ImportError {
  row: number
  field: string
  message: string
  value?: unknown
}

// Settings API Types
export interface UserSettings {
  notifications: NotificationSettings
  preferences: UserPreferences
  privacy: PrivacySettings
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  inApp: boolean
  types: {
    applicationUpdates: boolean
    deadlines: boolean
    interviews: boolean
    offers: boolean
  }
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  defaultView: 'board' | 'list' | 'calendar'
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private'
  shareAnalytics: boolean
  dataRetention: number
}

// Helper Types
export type ApplicationStatus =
  | 'wishlist'
  | 'applied'
  | 'phone_screen'
  | 'assessment'
  | 'take_home'
  | 'interviewing'
  | 'final_round'
  | 'offered'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'
  | 'ghosted'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type ContentType =
  | 'application/json'
  | 'multipart/form-data'
  | 'application/x-www-form-urlencoded'

// API Client Configuration
export interface ApiClientConfig {
  baseUrl: string
  timeout: number
  retries: number
  headers?: Record<string, string>
  auth?: {
    type: 'bearer' | 'basic'
    token: string
  }
}

// Request/Response Interceptors
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig
  onRequestError?: (error: Error) => Promise<Error> | Error
  onResponse?: (response: Response) => Response
  onResponseError?: (error: ApiError) => Promise<ApiError> | ApiError
}

export interface RequestConfig {
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  params?: Record<string, unknown>
  data?: unknown
  timeout?: number
  signal?: AbortSignal
}
