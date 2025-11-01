'use server'

import { createClient } from '@/lib/supabase/server'
import type { Application } from '@/lib/types/database.types'
import {
  getUserApplicationStats,
  getRecentApplications,
  searchApplications,
  getApplicationStatusHistory,
  bulkUpdateApplicationStatus,
  getApplicationTimeline,
  advancedSearchApplications,
  type ApplicationStats,
  type SearchResult,
  type StatusTransition,
  type BulkUpdateResult,
  type TimelineData,
  type SearchFilters,
} from '@/lib/api/database-functions'

type RecentApplication = Omit<Application, 'user_id' | 'notes'>
import { handleServerActionError } from '@/lib/errors/handlers'

/**
 * Get application statistics for the current user
 */
export async function getUserStatsAction(): Promise<ApplicationStats> {
  try {
    const supabase = await createClient()

    // Get user ID from auth context
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    return await getUserApplicationStats(supabase, user.id)
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Get recent applications with pagination
 */
export async function getRecentApplicationsAction(
  limit: number = 10,
  offset: number = 0
): Promise<RecentApplication[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    return await getRecentApplications(supabase, user.id, limit, offset)
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Search applications
 */
export async function searchApplicationsAction(
  query: string,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    return await searchApplications(supabase, user.id, query, limit, offset)
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Get application status history
 */
export async function getApplicationStatusHistoryAction(
  applicationId: string
): Promise<StatusTransition[]> {
  try {
    const supabase = await createClient()

    return await getApplicationStatusHistory(supabase, applicationId)
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Bulk update application statuses
 */
export async function bulkUpdateStatusAction(
  applicationIds: string[],
  newStatus: string
): Promise<BulkUpdateResult[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    const results = await bulkUpdateApplicationStatus(
      supabase,
      applicationIds,
      newStatus as Application['status'],
      user.id
    )

    // Revalidate the dashboard to reflect changes
    const { revalidatePath } = await import('next/cache')
    revalidatePath('/dashboard')

    return results
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Get application timeline for analytics
 */
export async function getApplicationTimelineAction(days: number = 30): Promise<TimelineData[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    return await getApplicationTimeline(supabase, user.id, days)
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Advanced search with filters
 */
export async function advancedSearchApplicationsAction(
  filters: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult[]> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    return await advancedSearchApplications(supabase, user.id, filters, limit, offset)
  } catch (error) {
    handleServerActionError(error)
  }
}

/**
 * Get application dashboard data (stats + recent applications)
 */
export async function getDashboardDataAction() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Get both stats and recent applications in parallel
    const [stats, recentApplications] = await Promise.all([
      getUserApplicationStats(supabase, user.id),
      getRecentApplications(supabase, user.id, 5, 0),
    ])

    return {
      stats,
      recentApplications,
    }
  } catch (error) {
    handleServerActionError(error)
  }
}
