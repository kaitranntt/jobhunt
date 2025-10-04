import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Application,
  ApplicationInsert,
  ApplicationUpdate,
} from '@/lib/types/database.types'

export async function getApplications(supabase: SupabaseClient): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch applications: ${error.message}`)

  return data
}

export async function getApplication(supabase: SupabaseClient, id: string): Promise<Application> {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).single()

  if (error) throw new Error(`Failed to fetch application: ${error.message}`)

  return data
}

export async function createApplication(supabase: SupabaseClient, application: ApplicationInsert): Promise<Application> {
  const { data, error } = await supabase.from('applications').insert(application).select().single()

  if (error) throw new Error(`Failed to create application: ${error.message}`)

  return data
}

export async function updateApplication(
  supabase: SupabaseClient,
  id: string,
  updates: ApplicationUpdate
): Promise<Application> {
  const { data, error } = await supabase
    .from('applications')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update application: ${error.message}`)

  return data
}

export async function deleteApplication(supabase: SupabaseClient, id: string): Promise<void> {

  const { error } = await supabase.from('applications').delete().eq('id', id)

  if (error) throw new Error(`Failed to delete application: ${error.message}`)
}

export async function getApplicationsByStatus(
  supabase: SupabaseClient,
  status: Application['status']
): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch applications by status: ${error.message}`)

  return data
}
