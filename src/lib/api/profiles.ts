import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  UserProfile,
  UserProfileInsert,
  UserProfileUpdate,
} from '@/lib/types/database.types'
import { createClient } from '@/lib/supabase/client'

/**
 * Get user profile by user ID
 * @param supabase - Supabase client instance
 * @param userId - User ID to fetch profile for
 * @returns User profile or null if not found
 * @throws Error if database operation fails
 */
export async function getProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Return null if profile doesn't exist (PGRST116 is "no rows returned")
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(`Failed to fetch profile: ${error.message}`)
  }

  return data
}

/**
 * Create a new user profile
 * @param supabase - Supabase client instance
 * @param profile - Profile data to insert
 * @returns Created user profile
 * @throws Error if database operation fails
 */
export async function createProfile(
  supabase: SupabaseClient,
  profile: UserProfileInsert
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select()
    .single()

  if (error) throw new Error(`Failed to create profile: ${error.message}`)

  return data
}

/**
 * Update an existing user profile
 * @param supabase - Supabase client instance
 * @param userId - User ID whose profile to update
 * @param updates - Partial profile data to update
 * @returns Updated user profile
 * @throws Error if database operation fails
 */
export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: UserProfileUpdate
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw new Error(`Failed to update profile: ${error.message}`)

  return data
}

/**
 * Client-side wrapper: Create a new user profile using client Supabase instance
 * @param profile - Profile data to insert
 * @returns Created user profile
 * @throws Error if database operation fails
 */
export async function createUserProfile(profile: UserProfileInsert): Promise<UserProfile> {
  const supabase = createClient()
  return createProfile(supabase, profile)
}

/**
 * Client-side wrapper: Get user profile by user ID using client Supabase instance
 * @param userId - User ID to fetch profile for
 * @returns User profile or null if not found
 * @throws Error if database operation fails
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()
  return getProfile(supabase, userId)
}

/**
 * Client-side wrapper: Update user profile using client Supabase instance
 * @param userId - User ID whose profile to update
 * @param updates - Partial profile data to update
 * @returns Updated user profile
 * @throws Error if database operation fails
 */
export async function updateUserProfile(
  userId: string,
  updates: UserProfileUpdate
): Promise<UserProfile> {
  const supabase = createClient()
  return updateProfile(supabase, userId, updates)
}
