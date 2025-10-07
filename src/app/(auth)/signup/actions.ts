'use server'

import { createClient } from '@/lib/supabase/server'
import { createProfile } from '@/lib/api/profiles'
import { createProfileSchema } from '@/lib/schemas/profile.schema'
import type { UserProfileInsert } from '@/lib/types/database.types'

/**
 * Server action to create a new user profile
 * @param data - User profile data to create
 * @returns Created user profile
 * @throws Error if validation fails or database operation fails
 */
export async function createUserProfileAction(data: UserProfileInsert) {
  try {
    // Validate input data
    const validatedData = createProfileSchema.parse(data)

    // Convert undefined to null for database compatibility
    const profileData: UserProfileInsert = {
      user_id: validatedData.user_id,
      full_name: validatedData.full_name,
      phone: validatedData.phone ?? null,
      location: validatedData.location ?? null,
      job_role: validatedData.job_role ?? null,
      desired_roles: validatedData.desired_roles ?? null,
      desired_industries: validatedData.desired_industries ?? null,
      experience_years: validatedData.experience_years ?? null,
      linkedin_url: validatedData.linkedin_url ?? null,
      portfolio_url: validatedData.portfolio_url ?? null,
    }

    // Get server-side Supabase client
    const supabase = await createClient()

    // Create profile using API function
    const profile = await createProfile(supabase, profileData)

    return { success: true, data: profile, error: null }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create user profile'
    return { success: false, data: null, error: errorMessage }
  }
}
