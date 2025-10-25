import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const error = searchParams.get('error')

  // Process OAuth callback route normally - let session establishment work
  // The callback route will handle OAuth code exchange automatically

  // Handle OAuth errors (but not OAuth code exchange - that's handled by route handler)
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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
