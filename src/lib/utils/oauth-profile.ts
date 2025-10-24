import type { User } from '@supabase/supabase-js'
import type { UserProfileInsert } from '@/lib/types/database.types'

/**
 * Extract user profile data from OAuth user metadata
 * @param user - Supabase user object from OAuth callback
 * @returns Minimal user profile data for automatic creation
 */
export function extractProfileFromOAuth(user: User): UserProfileInsert {
  const metadata = user.user_metadata || {}
  const { full_name, name, first_name, last_name } = metadata

  // Try to get the best available name from OAuth metadata
  let displayName = full_name || name || ''

  // If we have first and last name separately, combine them
  if (!displayName && first_name && last_name) {
    displayName = `${first_name} ${last_name}`
  }

  // If still no name, try email prefix as fallback
  if (!displayName && user.email) {
    displayName = user.email.split('@')[0]
  }

  return {
    user_id: user.id,
    full_name: displayName || 'Job Seeker',
    phone: null,
    location: null,
    job_role: null,
    desired_roles: null,
    desired_industries: null,
    experience_years: null,
    linkedin_url: null,
    portfolio_url: null,
  }
}

/**
 * Check if user signed up via OAuth provider
 * @param user - Supabase user object
 * @returns True if user signed up via OAuth
 */
export function isOAuthUser(user: User): boolean {
  return !!(user.identities && user.identities.some(identity => identity.provider !== 'email'))
}

/**
 * Get OAuth provider name from user identities
 * @param user - Supabase user object
 * @returns OAuth provider name or null
 */
export function getOAuthProvider(user: User): string | null {
  if (!user.identities || user.identities.length === 0) {
    return null
  }

  const nonEmailIdentity = user.identities.find(identity => identity.provider !== 'email')
  return nonEmailIdentity?.provider || null
}

/**
 * Check if profile completion is needed for OAuth user
 * @param profile - User profile object
 * @returns True if additional profile data collection is needed
 */
export function needsProfileCompletion(profile: Partial<UserProfileInsert>): boolean {
  return !profile.phone && !profile.location && !profile.job_role
}
