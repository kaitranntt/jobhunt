import { createClient } from '@/lib/supabase/client'
import type { Contact, ContactInsert, ContactUpdate } from '@/lib/types/database.types'

export async function createContact(contact: ContactInsert): Promise<Contact> {
  const supabase = createClient()

  const { data, error } = await supabase.from('contacts').insert(contact).select().single()

  if (error) throw new Error(`Failed to create contact: ${error.message}`)

  return data
}

export async function getContactsByApplication(applicationId: string): Promise<Contact[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch contacts: ${error.message}`)

  return data
}

export async function getContactsByUser(userId: string): Promise<Contact[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch contacts: ${error.message}`)

  return data
}

export async function updateContact(id: string, updates: ContactUpdate): Promise<Contact> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Failed to update contact: ${error.message}`)

  return data
}

export async function deleteContact(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('contacts').delete().eq('id', id)

  if (error) throw new Error(`Failed to delete contact: ${error.message}`)
}
