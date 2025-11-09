import type { SupabaseClient } from '@supabase/supabase-js'
import type { Application, ApplicationInsert, ApplicationUpdate } from '@/lib/types/database.types'

async function verifyAuthenticationContext(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication error:', authError)
    }
    throw new Error(`Authentication failed: ${authError.message}. Please check your login session.`)
  }

  if (!user) {
    throw new Error('No authenticated user found. Please log in and try again.')
  }

  return user.id
}

export async function getApplications(supabase: SupabaseClient): Promise<Application[]> {
  try {
    // Verify authentication context first
    await verifyAuthenticationContext(supabase)

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('status', { ascending: true })
      .order('position', { ascending: true })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Database query error:', error)
      }

      // Provide specific guidance for common errors
      if (error.message.includes('permission denied')) {
        throw new Error(
          `Permission denied accessing applications table. This usually indicates: ` +
            `1) RLS policies are not properly configured, ` +
            `2) Environment variables are missing/incorrect, or ` +
            `3) User session is invalid. Original error: ${error.message}`
        )
      }

      throw new Error(`Failed to fetch applications: ${error.message}`)
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getApplications error:', error)
    }
    throw error
  }
}

export async function getApplication(supabase: SupabaseClient, id: string): Promise<Application> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only access their own applications
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch application:', error)
      }
      throw new Error(`Failed to fetch application: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getApplication error:', error)
    }
    throw error
  }
}

export async function createApplication(
  supabase: SupabaseClient,
  application: ApplicationInsert
): Promise<Application> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    // Ensure the application is created for the authenticated user
    const applicationWithUser = { ...application, user_id: userId }

    const { data, error } = await supabase
      .from('applications')
      .insert(applicationWithUser)
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to create application:', error)
      }
      throw new Error(`Failed to create application: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('createApplication error:', error)
    }
    throw error
  }
}

export async function updateApplication(
  supabase: SupabaseClient,
  id: string,
  updates: ApplicationUpdate
): Promise<Application> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own applications
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update application:', error)
      }
      throw new Error(`Failed to update application: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('updateApplication error:', error)
    }
    throw error
  }
}

export async function deleteApplication(supabase: SupabaseClient, id: string): Promise<void> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only delete their own applications

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to delete application:', error)
      }
      throw new Error(`Failed to delete application: ${error.message}`)
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('deleteApplication error:', error)
    }
    throw error
  }
}

export async function getApplicationsByStatus(
  supabase: SupabaseClient,
  status: Application['status']
): Promise<Application[]> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('status', status)
      .eq('user_id', userId) // Ensure user can only access their own applications
      .order('position', { ascending: true })

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to fetch applications by status:', error)
      }
      throw new Error(`Failed to fetch applications by status: ${error.message}`)
    }

    return data || []
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('getApplicationsByStatus error:', error)
    }
    throw error
  }
}

/**
 * Reorder applications within a column
 * Updates positions for all applications in the reordered list
 */
export async function reorderApplicationsInColumn(
  supabase: SupabaseClient,
  updates: Array<{ id: string; position: number }>
): Promise<void> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    // Execute all updates in parallel
    const updatePromises = updates.map(({ id, position }) =>
      supabase
        .from('applications')
        .update({ position, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', userId) // Ensure user can only update their own applications
    )

    const results = await Promise.all(updatePromises)

    // Check for errors
    const errors = results.filter(result => result.error)
    if (errors.length > 0) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to reorder applications:', errors)
      }
      throw new Error('Failed to reorder applications')
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('reorderApplicationsInColumn error:', error)
    }
    throw error
  }
}

/**
 * Update application position and optionally status
 * Used for both same-column reordering and cross-column moves
 */
export async function updateApplicationPosition(
  supabase: SupabaseClient,
  id: string,
  position: number,
  status?: Application['status']
): Promise<Application> {
  try {
    const userId = await verifyAuthenticationContext(supabase)

    const updates: Partial<Application> = {
      position,
      updated_at: new Date().toISOString(),
    }

    if (status) {
      updates.status = status
    }

    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId) // Ensure user can only update their own applications
      .select()
      .single()

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to update application position:', error)
      }
      throw new Error(`Failed to update application position: ${error.message}`)
    }

    return data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('updateApplicationPosition error:', error)
    }
    throw error
  }
}
