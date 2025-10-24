import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Check if user signed up via OAuth and needs profile creation
 */
async function handleOAuthProfileCreation(request: NextRequest, supabase: any) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    // Check if user has OAuth identities (non-email providers)
    const hasOAuthIdentity = user.identities?.some((identity: any) => identity.provider !== 'email')

    if (!hasOAuthIdentity) return false

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) return false

    // Create minimal profile from OAuth metadata
    const metadata = user.user_metadata || {}
    const displayName =
      metadata.full_name || metadata.name || user.email?.split('@')[0] || 'Job Seeker'

    const profileData = {
      user_id: user.id,
      full_name: displayName,
      phone: null,
      location: null,
      job_role: null,
      desired_roles: null,
      desired_industries: null,
      experience_years: null,
      linkedin_url: null,
      portfolio_url: null,
    }

    const { error: insertError } = await supabase.from('user_profiles').insert(profileData)

    if (insertError) {
      console.error('Middleware OAuth profile creation failed:', insertError)
      return false
    }

    return true
  } catch (error) {
    console.error('OAuth profile creation error in middleware:', error)
    return false
  }
}

export async function updateSession(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const authCode = searchParams.get('code')
  const error = searchParams.get('error')

  // Handle OAuth callback on any route
  if (authCode && !error) {
    try {
      // Create response object for OAuth processing
      const response = NextResponse.next({
        request,
      })

      // Create Supabase client for OAuth processing
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
              )
            },
          },
        }
      )

      // Exchange OAuth code for session
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(authCode)

      if (!exchangeError) {
        // Handle OAuth profile creation
        await handleOAuthProfileCreation(request, supabase)

        // Successful OAuth - redirect to dashboard with welcome flag, removing code from URL
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        url.searchParams.delete('code')
        url.searchParams.delete('access_token')
        url.searchParams.delete('refresh_token')
        url.searchParams.set('welcome', 'oauth')
        return NextResponse.redirect(url)
      }

      // If exchange failed, redirect to login with error
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('error', 'Authentication failed. Please try again.')
      loginUrl.searchParams.delete('code')
      return NextResponse.redirect(loginUrl)
    } catch {
      // OAuth processing failed - redirect to login
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('error', 'Authentication error. Please try again.')
      loginUrl.searchParams.delete('code')
      return NextResponse.redirect(loginUrl)
    }
  }

  // Handle OAuth errors
  if (error) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('error', error)
    loginUrl.searchParams.delete('code')
    return NextResponse.redirect(loginUrl)
  }

  // Create response object that we'll modify with cookies
  const response = NextResponse.next({
    request,
  })

  // Create Supabase client with cookie handling for Edge Runtime
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the response object
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Always use getUser() instead of getSession() in server code
  // getUser() validates the auth token with Supabase Auth server every time
  // This also triggers token refresh if expired, updating cookies via setAll()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect unauthenticated users to login, except for public routes
  if (
    !user &&
    request.nextUrl.pathname !== '/' && // Allow landing page
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Prevent authenticated users from accessing auth pages
  if (
    user &&
    (request.nextUrl.pathname.startsWith('/login') ||
      request.nextUrl.pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}
