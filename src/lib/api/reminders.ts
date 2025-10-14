import { createClient } from '@/lib/supabase/client'
import type { Reminder, ReminderInsert, ReminderUpdate } from '@/lib/types/database.types'

export async function createReminder(data: ReminderInsert): Promise<Reminder> {
  const supabase = createClient()

  const { data: reminder, error } = await supabase.from('reminders').insert(data).select().single()

  if (error) throw new Error(`Failed to create reminder: ${error.message}`)

  return reminder
}

export async function getRemindersByApplication(applicationId: string): Promise<Reminder[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('application_id', applicationId)
    .order('reminder_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch reminders: ${error.message}`)

  return data
}

export async function getUpcomingReminders(userId: string, days: number = 7): Promise<Reminder[]> {
  const supabase = createClient()

  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  const { data, error } = await supabase
    .from('reminders')
    .select('*')
    .eq('user_id', userId)
    .gte('reminder_date', now.toISOString())
    .lte('reminder_date', future.toISOString())
    .order('reminder_date', { ascending: true })

  if (error) throw new Error(`Failed to fetch upcoming reminders: ${error.message}`)

  return data
}

export async function updateReminder(id: string, updates: ReminderUpdate): Promise<Reminder> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('reminders')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update reminder: ${error.message}`)

  return data
}

export async function markReminderComplete(id: string): Promise<Reminder> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('reminders')
    .update({ is_completed: true })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to mark reminder complete: ${error.message}`)

  return data
}

export async function deleteReminder(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('reminders').delete().eq('id', id)

  if (error) throw new Error(`Failed to delete reminder: ${error.message}`)
}
