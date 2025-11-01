import type { SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
// Note: This import is only used on the server side
// The getServerClient function should only be called from server components
let cookiesModule: typeof import('next/headers') | null = null

async function getCookies() {
  if (!cookiesModule) {
    cookiesModule = await import('next/headers')
  }
  return cookiesModule.cookies()
}

/**
 * Supabase Client Singleton Pattern
 *
 * This provides a unified interface for creating Supabase clients
 * with proper caching and environment-specific optimizations.
 */

// Global cache for client instances
let serverClientCache: SupabaseClient | null = null
let browserClientCache: SupabaseClient | null = null

// Environment validation
function validateEnvironmentVariables() {
  const required = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missing.join(', ')}. ` +
        'Please check your .env.local file.'
    )
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: required.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: required.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

/**
 * Get cached browser client for client-side components
 */
export function getBrowserClient(): SupabaseClient {
  if (!browserClientCache) {
    const env = validateEnvironmentVariables()
    browserClientCache = createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return browserClientCache
}

/**
 * Get cached server client for server-side operations
 */
export async function getServerClient(): Promise<SupabaseClient> {
  if (!serverClientCache) {
    const env = validateEnvironmentVariables()
    const cookieStore = await getCookies()

    serverClientCache = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: Array<{ name: string; value: string } & Record<string, unknown>>) {
            try {
              cookiesToSet.forEach(({ name, value, ...options }) =>
                cookieStore.set(name, value, Object.keys(options).length > 0 ? options : undefined)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
  }
  return serverClientCache
}

/**
 * Smart client creator that detects environment automatically
 * Use this in most cases unless you need specific client behavior
 */
export async function createSmartClient(): Promise<SupabaseClient> {
  // Check if we're in a server environment
  if (typeof window === 'undefined') {
    // Server environment - use server client
    return getServerClient()
  } else {
    // Browser environment - use browser client
    return getBrowserClient()
  }
}

/**
 * Service role client for privileged operations
 * Use sparingly and only for server-side operations
 */
export async function getServiceRoleClient(): Promise<SupabaseClient> {
  const env = validateEnvironmentVariables()

  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not set. This client is required for privileged operations.'
    )
  }

  const cookieStore = await getCookies()

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: Array<{ name: string; value: string } & Record<string, unknown>>) {
        try {
          cookiesToSet.forEach(({ name, value, ...options }) =>
            cookieStore.set(name, value, Object.keys(options).length > 0 ? options : undefined)
          )
        } catch {
          // Handle server component cookie setting
        }
      },
    },
  })
}

/**
 * Reset client cache (useful for testing or cache invalidation)
 */
export function resetClientCache(): void {
  serverClientCache = null
  browserClientCache = null
}

/**
 * Health check for Supabase connection
 */
export async function healthCheck(client: SupabaseClient): Promise<boolean> {
  try {
    const { error } = await client.from('applications').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}
