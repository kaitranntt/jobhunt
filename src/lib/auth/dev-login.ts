/**
 * Development Authentication Helpers
 * Provides quick login functionality for development and testing
 *
 * SECURITY WARNING: Only use in development environment!
 * These functions bypass normal authentication flows for rapid testing.
 */

import { createClient } from '@/lib/supabase/client'

/**
 * Test user credentials
 * These match the seeded user in supabase/seed.sql
 */
export const TEST_USER = {
  email: 'test@jobhunt.dev',
  password: 'TestUser123!',
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Test User',
} as const

/**
 * Quick login with test user credentials
 * Returns true if login successful, false otherwise
 *
 * Usage in components:
 * ```typescript
 * import { devLoginAsTestUser } from '@/lib/auth/dev-login'
 *
 * const handleDevLogin = async () => {
 *   const success = await devLoginAsTestUser()
 *   if (success) {
 *     router.push('/dashboard')
 *   }
 * }
 * ```
 */
export async function devLoginAsTestUser(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('devLoginAsTestUser() only works in development mode')
    return false
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    })

    if (error) {
      console.error('Dev login failed:', error.message)
      return false
    }

    if (data.user) {
      console.log('✅ Dev login successful:', TEST_USER.email)
      return true
    }

    return false
  } catch (error) {
    console.error('Dev login error:', error)
    return false
  }
}

/**
 * Login with custom credentials (useful for testing different users)
 */
export async function devLoginWithCredentials(email: string, password: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('devLoginWithCredentials() only works in development mode')
    return false
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Dev login failed:', error.message)
      return false
    }

    if (data.user) {
      console.log('✅ Dev login successful:', email)
      return true
    }

    return false
  } catch (error) {
    console.error('Dev login error:', error)
    return false
  }
}

/**
 * Sign in anonymously (requires enable_anonymous_sign_ins = true in Supabase)
 * Useful for testing public features or onboarding flows
 */
export async function devLoginAnonymously(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('devLoginAnonymously() only works in development mode')
    return false
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInAnonymously()

    if (error) {
      console.error('Anonymous login failed:', error.message)
      return false
    }

    if (data.user) {
      console.log('✅ Anonymous login successful:', data.user.id)
      return true
    }

    return false
  } catch (error) {
    console.error('Anonymous login error:', error)
    return false
  }
}

/**
 * Get current user session info (for debugging)
 */
export async function devGetCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Failed to get user:', error)
    return null
  }

  if (user) {
    console.log('Current user:', {
      id: user.id,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
    })
  } else {
    console.log('No user logged in')
  }

  return user
}

/**
 * Quick logout helper
 */
export async function devLogout(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  console.log('✅ Logged out successfully')
}
