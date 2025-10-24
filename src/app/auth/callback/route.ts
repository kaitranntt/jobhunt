import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateOAuthProfile } from '@/lib/auth/oauth-actions'

function getRedirectPath(redirectParam: string | null) {
  if (!redirectParam) return '/dashboard'

  if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    return redirectParam
  }

  return '/dashboard'
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams, origin } = request.nextUrl

  const authCode = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const redirectParam = getRedirectPath(searchParams.get('redirect_to'))

  // Handle missing code or errors
  if (!authCode || errorParam || errorDescription) {
    const loginUrl = new URL('/login', origin)
    const errorMessage = errorDescription || errorParam || 'Unable to authenticate with Google'
    loginUrl.searchParams.set('error', errorMessage)
    // Clean URL parameters
    loginUrl.searchParams.delete('code')
    loginUrl.searchParams.delete('access_token')
    loginUrl.searchParams.delete('refresh_token')
    return NextResponse.redirect(loginUrl)
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(authCode)

    if (error) {
      const loginUrl = new URL('/login', origin)
      loginUrl.searchParams.set('error', error.message)
      loginUrl.searchParams.delete('code')
      return NextResponse.redirect(loginUrl)
    }

    // For OAuth users, automatically create profile if it doesn't exist
    if (user) {
      const profileResult = await getOrCreateOAuthProfile(user)

      if (!profileResult.success && !profileResult.data) {
        // If profile creation fails and no existing profile, redirect to login with error
        const loginUrl = new URL('/login', origin)
        loginUrl.searchParams.set('error', 'Profile setup failed. Please try again.')
        loginUrl.searchParams.delete('code')
        return NextResponse.redirect(loginUrl)
      }

      // If this is a new OAuth profile, add a flag for welcome experience
      if (profileResult.isNew) {
        const dashboardUrl = new URL(redirectParam, origin)
        dashboardUrl.searchParams.set('welcome', 'oauth')
        return NextResponse.redirect(dashboardUrl)
      }
    }

    // Successful authentication - redirect to intended destination
    return NextResponse.redirect(new URL(redirectParam, origin))
  } catch {
    // Handle unexpected errors
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'Authentication failed. Please try again.')
    loginUrl.searchParams.delete('code')
    return NextResponse.redirect(loginUrl)
  }
}
