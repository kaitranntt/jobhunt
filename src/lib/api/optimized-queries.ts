import type { SupabaseClient } from '@supabase/supabase-js'
import type { Application } from '@/lib/types/database.types'

export interface PaginationOptions {
  page?: number
  limit?: number
  offset?: number
}

export interface ApplicationFilters {
  status?: Application['status']
  search?: string
  companyId?: string
  dateFrom?: Date
  dateTo?: Date
}

export interface SortOptions {
  column?: keyof Application
  ascending?: boolean
}

/**
 * Optimized applications query with pagination, filtering, and sorting
 * Only selects necessary fields to reduce payload size
 */
export async function getApplicationsOptimized(
  supabase: SupabaseClient,
  options: {
    pagination?: PaginationOptions
    filters?: ApplicationFilters
    sort?: SortOptions
    fields?: string[]
  } = {}
): Promise<{
  data: Application[]
  count: number
  hasMore: boolean
}> {
  const {
    pagination = { page: 1, limit: 50 },
    filters = {},
    sort = { column: 'created_at', ascending: false },
    fields = [
      'id',
      'user_id',
      'company_id',
      'company_name',
      'job_title',
      'job_url',
      'location',
      'salary_range',
      'status',
      'date_applied',
      'notes',
      'created_at',
      'updated_at',
    ],
  } = options

  try {
    // Build query
    let query = supabase.from('applications').select(fields.join(', '), { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.search) {
      query = query.or(
        `company_name.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
      )
    }

    if (filters.dateFrom) {
      query = query.gte('date_applied', filters.dateFrom.toISOString())
    }

    if (filters.dateTo) {
      query = query.lte('date_applied', filters.dateTo.toISOString())
    }

    // Apply sorting
    if (sort.column) {
      query = query.order(sort.column, { ascending: sort.ascending })
    }

    // Apply pagination
    const offset = pagination.offset ?? ((pagination.page ?? 1) - 1) * (pagination.limit ?? 50)
    const limit = pagination.limit ?? 50

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    const hasMore = count ? offset + limit < count : false

    return {
      data: (data as unknown as Application[]) || [],
      count: count || 0,
      hasMore,
    }
  } catch (error) {
    console.error('getApplicationsOptimized error:', error)
    throw error
  }
}

/**
 * Get applications with company data joined
 * Reduces need for separate company queries
 */
export async function getApplicationsWithCompanies(
  supabase: SupabaseClient,
  options: {
    pagination?: PaginationOptions
    filters?: ApplicationFilters
    sort?: SortOptions
  } = {}
): Promise<{
  data: (Application & {
    company?: { id: string; name: string; website?: string; logo_url?: string }
  })[]
  count: number
  hasMore: boolean
}> {
  const { pagination = { page: 1, limit: 50 }, filters = {}, sort = {} } = options

  try {
    // Use the applications_with_company view for optimized queries
    let query = supabase.from('applications_with_company').select('*', { count: 'exact' })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.search) {
      query = query.or(
        `company_name.ilike.%${filters.search}%,job_title.ilike.%${filters.search}%,location.ilike.%${filters.search}%`
      )
    }

    // Apply sorting
    const sortColumn = sort.column || 'created_at'
    query = query.order(sortColumn, { ascending: sort.ascending ?? false })

    // Apply pagination
    const offset = ((pagination.page ?? 1) - 1) * (pagination.limit ?? 50)
    const limit = pagination.limit ?? 50

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch applications with companies: ${error.message}`)
    }

    const hasMore = count ? offset + limit < count : false

    return {
      data: data || [],
      count: count || 0,
      hasMore,
    }
  } catch (error) {
    console.error('getApplicationsWithCompanies error:', error)
    throw error
  }
}

/**
 * Get application statistics for dashboard
 * Optimized query that aggregates data server-side
 */
export async function getApplicationStats(supabase: SupabaseClient): Promise<{
  total: number
  byStatus: Record<Application['status'], number>
  recentApplications: number
  thisMonthApplications: number
}> {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    // Get total count and status breakdown in one query
    const { data: statusData, error: statusError } = await supabase
      .from('applications')
      .select('status')

    if (statusError) {
      throw new Error(`Failed to fetch status data: ${statusError.message}`)
    }

    // Get recent applications counts
    const { data: recentData, error: recentError } = await supabase
      .from('applications')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (recentError) {
      throw new Error(`Failed to fetch recent data: ${recentError.message}`)
    }

    const { data: monthData, error: monthError } = await supabase
      .from('applications')
      .select('created_at')
      .gte('created_at', startOfMonth.toISOString())

    if (monthError) {
      throw new Error(`Failed to fetch month data: ${monthError.message}`)
    }

    // Calculate statistics
    const total = statusData?.length || 0
    const byStatus =
      statusData?.reduce(
        (acc, app) => {
          const status = app.status as Application['status']
          acc[status] = (acc[status] || 0) + 1
          return acc
        },
        {} as Record<Application['status'], number>
      ) || ({} as Record<Application['status'], number>)

    return {
      total,
      byStatus,
      recentApplications: recentData?.length || 0,
      thisMonthApplications: monthData?.length || 0,
    }
  } catch (error) {
    console.error('getApplicationStats error:', error)
    throw error
  }
}

/**
 * Search applications with full-text search optimization
 */
export async function searchApplications(
  supabase: SupabaseClient,
  searchTerm: string,
  options: {
    pagination?: PaginationOptions
    filters?: Omit<ApplicationFilters, 'search'>
  } = {}
): Promise<{
  data: Application[]
  count: number
  hasMore: boolean
}> {
  if (!searchTerm.trim()) {
    return getApplicationsOptimized(supabase, options)
  }

  try {
    const { pagination = { page: 1, limit: 25 }, filters = {} } = options

    // Build search query with multiple fields
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .or(
        `company_name.ilike.%${searchTerm}%,job_title.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,notes.ilike.%${searchTerm}%`
      )

    // Apply additional filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.dateFrom) {
      query = query.gte('date_applied', filters.dateFrom.toISOString())
    }

    if (filters.dateTo) {
      query = query.lte('date_applied', filters.dateTo.toISOString())
    }

    // Apply pagination
    const offset = ((pagination.page ?? 1) - 1) * (pagination.limit ?? 25)
    const limit = pagination.limit ?? 25

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Search failed: ${error.message}`)
    }

    const hasMore = count ? offset + limit < count : false

    return {
      data: data || [],
      count: count || 0,
      hasMore,
    }
  } catch (error) {
    console.error('searchApplications error:', error)
    throw error
  }
}
