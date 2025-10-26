import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function validateEnvironmentVariables(): {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
} {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  const optionalVars = {
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  const missingVars = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Supabase environment variables: ${missingVars.join(', ')}. ` +
        'Please check your .env.local file and ensure all required variables are set. ' +
        'See .env.example for the required variables.'
    )
  }

  // At this point, TypeScript knows these are non-null strings
  return {
    NEXT_PUBLIC_SUPABASE_URL: requiredVars.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredVars.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ...optionalVars, // Spread optional variables (may be undefined)
  }
}

export async function createClient() {
  try {
    const envVars = validateEnvironmentVariables()
    const cookieStore = await cookies()

    return createServerClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to create Supabase server client:', error)
    }
    throw error
  }
}
