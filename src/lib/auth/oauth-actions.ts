'use server'

import { createClient } from '@/lib/supabase/server'
import { createProfile } from '@/lib/api/profiles'
import { extractProfileFromOAuth, isOAuthUser } from '@/lib/utils/oauth-profile'
import type { User } from '@supabase/supabase-js'

/**
 * Create user profile automatically for OAuth users
 * @param user - Supabase user object from OAuth callback
 * @returns Created user profile or null if creation failed
 */
export async function createOAuthUserProfile(user: User) {
  try {
    // Only proceed for OAuth users (not email signup)
    if (!isOAuthUser(user)) {
      return { success: false, error: 'Not an OAuth user' }
    }

    // Check if profile already exists
    const supabase = await createClient()
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      return { success: true, data: existingProfile, error: null }
    }

    // Extract profile data from OAuth metadata
    const profileData = extractProfileFromOAuth(user)

    // Create profile using existing API function
    const profile = await createProfile(supabase, profileData)

    return { success: true, data: profile, error: null }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create OAuth user profile'
    console.error('OAuth profile creation error:', error)
    return { success: false, data: null, error: errorMessage }
  }
}

/**
 * Get or create user profile for OAuth users
 * @param user - Supabase user object
 * @returns User profile (existing or newly created)
 */
export async function getOrCreateOAuthProfile(user: User) {
  try {
    const supabase = await createClient()

    // First, try to get existing profile
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      return { success: true, data: existingProfile, error: null, isNew: false }
    }

    // If no profile exists, create one for OAuth users
    if (isOAuthUser(user)) {
      const result = await createOAuthUserProfile(user)
      return { ...result, isNew: result.success }
    }

    // For email users without profile, they need to complete signup
    return {
      success: false,
      data: null,
      error: 'Profile completion required',
      isNew: false,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to get or create profile'
    return { success: false, data: null, error: errorMessage, isNew: false }
  }
}
