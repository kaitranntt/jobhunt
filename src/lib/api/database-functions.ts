/**
 * Database Functions API
 *
 * TypeScript wrappers for Supabase database functions
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Application } from '@/lib/types/database.types'
import { withErrorHandling } from '@/lib/errors/handlers'

/**
 * Application statistics interface
 */
export interface ApplicationStats {
  total_applications: number
  by_status: Record<string, number>
  updated_at: string
}

/**
 * Application with search rank
 */
export interface SearchResult extends Omit<Application, 'user_id' | 'notes'> {
  search_rank: number
}

/**
 * Status transition record
 */
export interface StatusTransition {
  from_status: string
  to_status: string
  changed_at: string
  days_in_status: number
}

/**
 * Bulk update result
 */
export interface BulkUpdateResult {
  id: string
  success: boolean
  error_message?: string
}

/**
 * Timeline analytics data
 */
export interface TimelineData {
  date: string
  applications_created: number
  applications_updated: number
  status_changes: Record<string, number>
}

/**
 * Cleanup operation result
 */
export interface CleanupResult {
  deleted_count: number
  archived_count: number
}

/**
 * Get application statistics for a user
 */
export const getUserApplicationStats = withErrorHandling(
  async (supabase: SupabaseClient, userId: string): Promise<ApplicationStats> => {
    const { data, error } = await supabase
      .rpc('get_user_application_stats', { p_user_id: userId })
      .single()

    if (error) {
      throw new Error(`Failed to fetch application statistics: ${error.message}`)
    }

    return data as ApplicationStats
  },
  { context: { operation: 'getUserApplicationStats' } }
)

/**
 * Get recent applications with pagination
 */
export const getRecentApplications = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<Omit<Application, 'user_id' | 'notes'>[]> => {
    const { data, error } = await supabase.rpc('get_recent_applications', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      throw new Error(`Failed to fetch recent applications: ${error.message}`)
    }

    return data as Omit<Application, 'user_id' | 'notes'>[]
  },
  { context: { operation: 'getRecentApplications' } }
)

/**
 * Search applications across multiple fields with ranking
 */
export const searchApplications = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    query: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult[]> => {
    const { data, error } = await supabase.rpc('search_applications', {
      p_user_id: userId,
      p_query: query,
      p_limit: limit,
      p_offset: offset,
    })

    if (error) {
      throw new Error(`Failed to search applications: ${error.message}`)
    }

    return data as SearchResult[]
  },
  { context: { operation: 'searchApplications' } }
)

/**
 * Get status transition history for an application
 */
export const getApplicationStatusHistory = withErrorHandling(
  async (supabase: SupabaseClient, applicationId: string): Promise<StatusTransition[]> => {
    const { data, error } = await supabase.rpc('get_application_status_history', {
      p_application_id: applicationId,
    })

    if (error) {
      throw new Error(`Failed to fetch status history: ${error.message}`)
    }

    return data as StatusTransition[]
  },
  { context: { operation: 'getApplicationStatusHistory' } }
)

/**
 * Bulk update application statuses
 */
export const bulkUpdateApplicationStatus = withErrorHandling(
  async (
    supabase: SupabaseClient,
    applicationIds: string[],
    newStatus: Application['status'],
    userId: string
  ): Promise<BulkUpdateResult[]> => {
    const { data, error } = await supabase.rpc('bulk_update_application_status', {
      p_application_ids: applicationIds,
      p_new_status: newStatus,
      p_user_id: userId,
    })

    if (error) {
      throw new Error(`Failed to bulk update applications: ${error.message}`)
    }

    return data as BulkUpdateResult[]
  },
  { context: { operation: 'bulkUpdateApplicationStatus' } }
)

/**
 * Get application timeline for analytics
 */
export const getApplicationTimeline = withErrorHandling(
  async (supabase: SupabaseClient, userId: string, days: number = 30): Promise<TimelineData[]> => {
    const { data, error } = await supabase.rpc('get_application_timeline', {
      p_user_id: userId,
      p_days: days,
    })

    if (error) {
      throw new Error(`Failed to fetch application timeline: ${error.message}`)
    }

    return data as TimelineData[]
  },
  { context: { operation: 'getApplicationTimeline' } }
)

/**
 * Clean up old application data (admin function)
 */
export const cleanupOldApplications = withErrorHandling(
  async (supabase: SupabaseClient, days: number = 365): Promise<CleanupResult> => {
    const { data, error } = await supabase
      .rpc('cleanup_old_applications', {
        p_days: days,
      })
      .single()

    if (error) {
      throw new Error(`Failed to cleanup old applications: ${error.message}`)
    }

    return data as CleanupResult
  },
  { context: { operation: 'cleanupOldApplications' } }
)

/**
 * Advanced search with filters
 */
export interface SearchFilters {
  query?: string
  status?: Application['status'][]
  dateRange?: {
    start: string
    end: string
  }
  location?: string
  company?: string
}

export const advancedSearchApplications = withErrorHandling(
  async (
    supabase: SupabaseClient,
    userId: string,
    filters: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResult[]> => {
    let query = supabase.from('applications').select('*', { count: 'exact' }).eq('user_id', userId)

    // Apply filters
    if (filters.query) {
      query = query.or(
        `company_name.ilike.%${filters.query}%,job_title.ilike.%${filters.query}%,location.ilike.%${filters.query}%,notes.ilike.%${filters.query}%`
      )
    }

    if (filters.status && filters.status.length > 0) {
      query = query.in('status', filters.status)
    }

    if (filters.dateRange) {
      query = query
        .gte('date_applied', filters.dateRange.start)
        .lte('date_applied', filters.dateRange.end)
    }

    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }

    if (filters.company) {
      query = query.ilike('company_name', `%${filters.company}%`)
    }

    const { data, error } = await query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to perform advanced search: ${error.message}`)
    }

    // Transform to SearchResult format with basic ranking
    const results = (data as Application[]).map(app => ({
      ...app,
      search_rank: filters.query ? calculateSearchRank(app, filters.query!) : 1.0,
    }))

    return results
  },
  { context: { operation: 'advancedSearchApplications' } }
)

/**
 * Calculate search ranking score
 */
function calculateSearchRank(application: Application, query: string): number {
  const lowerQuery = query.toLowerCase()
  const lowerCompany = application.company_name.toLowerCase()
  const lowerJobTitle = application.job_title.toLowerCase()
  const lowerLocation = application.location?.toLowerCase() || ''
  const lowerNotes = application.notes?.toLowerCase() || ''

  if (lowerCompany.includes(lowerQuery)) return 1.0
  if (lowerJobTitle.includes(lowerQuery)) return 0.9
  if (lowerLocation.includes(lowerQuery)) return 0.7
  if (lowerNotes.includes(lowerQuery)) return 0.5

  return 0.1
}
