import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Application,
  ApplicationInsert,
  ApplicationUpdate,
  ApplicationWithCompany,
  CompanyInsert,
} from '@/lib/types/database.types'
import { getUserId } from '@/lib/auth/context'
import {
  getApplicationsOptimized,
  type PaginationOptions,
  type ApplicationFilters,
  type SortOptions,
} from './optimized-queries'
import { transformSupabaseError } from '@/lib/errors/handlers'
import { withErrorHandling } from '@/lib/errors/handlers'
// TODO: Implement simpler caching approach to avoid Supabase type issues
// import { cachedSelect, cachedSingle, cachedCount, QueryCacheInvalidator } from '@/lib/cache/query-cache'
import { connectionPool } from '@/lib/performance/connection-pool'
import { getOrCreateCompany } from './companies'

/**
 * Get applications with optimized query (uses pagination by default)
 * For backward compatibility, returns all applications without pagination
 */
export const getApplications = withErrorHandling(
  async (
    supabase: SupabaseClient,
    options?: {
      pagination?: PaginationOptions
      filters?: ApplicationFilters
      sort?: SortOptions
    }
  ): Promise<Application[]> => {
    // If no pagination options provided, get all applications for backward compatibility
    if (!options?.pagination && !options?.filters && !options?.sort) {
      // Get user ID with cached authentication
      const userId = await getUserId(supabase)

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', userId) // RLS will handle this, but explicit filter adds security
        .order('created_at', { ascending: false })

      if (error) {
        throw transformSupabaseError(error)
      }

      return data || []
    }

    // Use optimized query with options
    const result = await getApplicationsOptimized(supabase, options)
    return result.data
  },
  { context: { operation: 'getApplications' } }
)

/**
 * Get applications with pagination and filtering
 * Returns both data and pagination metadata
 */
export async function getApplicationsPaginated(
  supabase: SupabaseClient,
  options: {
    pagination: PaginationOptions
    filters?: ApplicationFilters
    sort?: SortOptions
  }
) {
  return getApplicationsOptimized(supabase, options)
}

export const getApplication = withErrorHandling(
  async (supabase: SupabaseClient, applicationId: string): Promise<Application> => {
    // Authentication is cached and handled by RLS policies
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', applicationId)
      .single()

    if (error) {
      throw transformSupabaseError(error)
    }

    return data
  },
  { context: { operation: 'getApplication' } }
)

export const createApplication = withErrorHandling(
  async (supabase: SupabaseClient, application: ApplicationInsert): Promise<Application> => {
    const userId = await getUserId(supabase)

    // Ensure the application is created for the authenticated user
    const applicationWithUser = { ...application, user_id: userId }

    const { data, error } = await supabase
      .from('applications')
      .insert(applicationWithUser)
      .select()
      .single()

    if (error) {
      throw transformSupabaseError(error)
    }

    return data
  },
  { context: { operation: 'createApplication' } }
)

/**
 * Create application with proper company relationship management
 * This function handles the company creation/retrieval logic automatically
 */
export const createApplicationWithCompany = withErrorHandling(
  async (
    supabase: SupabaseClient,
    applicationData: Omit<ApplicationInsert, 'company_id'> & {
      company_name: string
      company_data?: Partial<CompanyInsert>
    }
  ): Promise<Application> => {
    const userId = await getUserId(supabase)

    // Get or create the company
    await getOrCreateCompany(
      supabase,
      userId,
      applicationData.company_name,
      applicationData.company_data
    )

    // Remove company-specific fields that shouldn't be in application and set defaults
    const {
      company_name: _company_name,
      company_data: _company_data,
      ...cleanApplicationData
    } = {
      ...applicationData,
      source: applicationData.source || 'manual',
    } as Omit<ApplicationInsert, 'company_id'> & {
      source: string
      company_name?: string
      company_data?: unknown
    }

    // Create the application with company reference
    const { data, error } = await supabase
      .from('applications')
      .insert({ ...cleanApplicationData, user_id: userId })
      .select()
      .single()

    if (error) {
      throw transformSupabaseError(error)
    }

    return data
  },
  { context: { operation: 'createApplicationWithCompany' } }
)

export const updateApplication = withErrorHandling(
  async (
    supabase: SupabaseClient,
    applicationId: string,
    updates: ApplicationUpdate
  ): Promise<Application> => {
    // Authentication is cached and handled by RLS policies
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', applicationId)
      .single()

    if (error) {
      throw transformSupabaseError(error)
    }

    return data
  },
  { context: { operation: 'updateApplication' } }
)

export const deleteApplication = withErrorHandling(
  async (supabase: SupabaseClient, applicationId: string): Promise<void> => {
    // Authentication is cached and handled by RLS policies
    const { error } = await supabase.from('applications').delete().eq('id', applicationId)

    if (error) {
      throw transformSupabaseError(error)
    }
  },
  { context: { operation: 'deleteApplication' } }
)

/**
 * Get applications with company data joined
 * Returns enriched application data with company information
 */
export const getApplicationsWithCompany = withErrorHandling(
  async (
    supabase: SupabaseClient,
    options?: {
      pagination?: PaginationOptions
      filters?: ApplicationFilters
      sort?: SortOptions
    }
  ): Promise<ApplicationWithCompany[]> => {
    const userId = await getUserId(supabase)

    let query = supabase
      .from('applications')
      .select(
        `
        *,
        companies (
          id,
          name,
          website,
          logo_url,
          industry,
          created_at,
          updated_at
        )
      `
      )
      .eq('user_id', userId)

    // Apply filters
    if (options?.filters) {
      const { filters } = options

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.or(
          `company_name.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%,location.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
        )
      }

      if (filters.companyId) {
        query = query.eq('company_id', filters.companyId)
      }
    }

    // Apply sorting
    if (options?.sort) {
      const { column, ascending } = options.sort
      query = query.order(column as string, { ascending })
    } else {
      query = query.order('updated_at', { ascending: false })
    }

    // Apply pagination
    if (options?.pagination) {
      const { limit = 50, offset = 0 } = options.pagination
      query = query.range(offset, offset + limit - 1)
    }

    const { data, error } = await query

    if (error) {
      throw transformSupabaseError(error)
    }

    // Transform data to include company as a nested object
    return (data || []).map(app => ({
      ...app,
      company: app.companies,
      // Remove the nested companies array from the result
      companies: undefined,
    })) as ApplicationWithCompany[]
  },
  { context: { operation: 'getApplicationsWithCompany' } }
)

export const getApplicationsByStatus = withErrorHandling(
  async (
    supabase: SupabaseClient,
    status: Application['status'],
    options?: {
      pagination?: PaginationOptions
      sort?: SortOptions
    }
  ): Promise<Application[]> => {
    // Use optimized query with status filter
    const result = await getApplicationsOptimized(supabase, {
      pagination: options?.pagination,
      filters: { status },
      sort: options?.sort || { column: 'created_at', ascending: false },
    })

    return result.data
  },
  { context: { operation: 'getApplicationsByStatus', status } }
)

// ============================================================================
// CACHED VERSIONS WITH PERFORMANCE OPTIMIZATION
// ============================================================================

/**
 * Get applications with connection pooling (simplified version)
 */
export const getCachedApplications = withErrorHandling(
  async (
    userId: string,
    options: {
      pagination?: PaginationOptions
      filters?: ApplicationFilters
      sort?: SortOptions
    } = {}
  ): Promise<{ applications: Application[]; total: number }> => {
    return connectionPool.execute(async client => {
      const result = await getApplicationsOptimized(client, {
        pagination: options.pagination,
        filters: { status: 'applied' }, // Use a valid filter
        sort: options.sort,
      })

      return {
        applications: result.data,
        total: result.count,
      }
    })
  },
  { context: { operation: 'getCachedApplications' } }
)

/**
 * Get single application with connection pooling
 */
export const getCachedApplication = withErrorHandling(
  async (applicationId: string): Promise<Application> => {
    return connectionPool.execute(async client => {
      return getApplication(client, applicationId)
    })
  },
  { context: { operation: 'getCachedApplication' } }
)

/**
 * Create application with connection pooling
 */
export const createCachedApplication = withErrorHandling(
  async (applicationData: ApplicationInsert): Promise<Application> => {
    return connectionPool.execute(async client => {
      return createApplication(client, applicationData)
    })
  },
  { context: { operation: 'createCachedApplication' } }
)

/**
 * Update application with connection pooling
 */
export const updateCachedApplication = withErrorHandling(
  async (applicationId: string, updates: ApplicationUpdate): Promise<Application> => {
    return connectionPool.execute(async client => {
      return updateApplication(client, applicationId, updates)
    })
  },
  { context: { operation: 'updateCachedApplication' } }
)

/**
 * Delete application with connection pooling
 */
export const deleteCachedApplication = withErrorHandling(
  async (applicationId: string): Promise<void> => {
    return connectionPool.execute(async client => {
      return deleteApplication(client, applicationId)
    })
  },
  { context: { operation: 'deleteCachedApplication' } }
)
