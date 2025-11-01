import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Authentication context to prevent redundant auth calls
 */
export interface AuthContext {
  user: {
    id: string
    email?: string
    // Add other user fields as needed
  }
}

// Simple in-memory cache for server-side requests
const authCache = new Map<string, { context: AuthContext; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Get authentication context with simple caching
 * Avoids redundant auth calls within the same request timeframe
 */
export async function getAuthContext(supabase: SupabaseClient): Promise<AuthContext> {
  // Create a cache key based on the current time bucket
  const cacheKey = `supabase-auth-${Math.floor(Date.now() / CACHE_TTL)}`

  // Check cache first
  const cached = authCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.context
  }

  // Fetch from Supabase if not cached
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

  const context: AuthContext = {
    user: {
      id: user.id,
      email: user.email,
    },
  }

  // Cache the result
  authCache.set(cacheKey, { context, timestamp: Date.now() })

  // Clean up old cache entries
  for (const [key, value] of authCache.entries()) {
    if (Date.now() - value.timestamp > CACHE_TTL) {
      authCache.delete(key)
    }
  }

  return context
}

/**
 * Get just the user ID from authentication context
 * Convenience function for common use case
 */
export async function getUserId(supabase: SupabaseClient): Promise<string> {
  const context = await getAuthContext(supabase)
  return context.user.id
}

/**
 * Verify authentication context with detailed error messages
 * Enhanced version with better error handling
 */
export async function verifyAuthenticationContext(supabase: SupabaseClient): Promise<string> {
  try {
    return await getUserId(supabase)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Authentication verification failed:', error)
    }
    throw error
  }
}
