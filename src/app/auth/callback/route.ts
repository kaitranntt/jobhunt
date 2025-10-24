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

  console.log('OAuth callback:', {
    hasAuthCode: !!authCode,
    errorParam,
    errorDescription,
    redirectParam,
    userAgent: request.headers.get('user-agent'),
  })

  // Handle missing code or errors
  if (!authCode || errorParam || errorDescription) {
    const loginUrl = new URL('/login', origin)
    const errorMessage = errorDescription || errorParam || 'Unable to authenticate with Google'
    loginUrl.searchParams.set('error', errorMessage)
    // Clean URL parameters
    loginUrl.searchParams.delete('code')
    loginUrl.searchParams.delete('access_token')
    loginUrl.searchParams.delete('refresh_token')
    console.log('OAuth callback error:', { errorMessage, hasAuthCode: !!authCode })
    return NextResponse.redirect(loginUrl)
  }

  try {
    console.log('Exchanging auth code for session...')
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(authCode)

    if (error) {
      console.error('OAuth code exchange failed:', error)
      const loginUrl = new URL('/login', origin)
      loginUrl.searchParams.set('error', error.message)
      loginUrl.searchParams.delete('code')
      return NextResponse.redirect(loginUrl)
    }

    console.log('OAuth successful:', { userId: user?.id, email: user?.email })

    // For OAuth users, automatically create profile if it doesn't exist
    if (user) {
      console.log('Processing profile for OAuth user...')
      const profileResult = await getOrCreateOAuthProfile(user)

      if (!profileResult.success && !profileResult.data) {
        console.error('Profile creation failed:', profileResult.error)
        // If profile creation fails and no existing profile, redirect to login with error
        const loginUrl = new URL('/login', origin)
        loginUrl.searchParams.set('error', 'Profile setup failed. Please try again.')
        loginUrl.searchParams.delete('code')
        return NextResponse.redirect(loginUrl)
      }

      // If this is a new OAuth profile, add a flag for welcome experience
      if (profileResult.isNew) {
        console.log('New OAuth profile created successfully')
        const dashboardUrl = new URL(redirectParam, origin)
        dashboardUrl.searchParams.set('welcome', 'oauth')
        return NextResponse.redirect(dashboardUrl)
      }

      console.log('Existing OAuth profile found')
    }

    // Successful authentication - redirect to intended destination
    console.log('Redirecting to:', redirectParam)
    return NextResponse.redirect(new URL(redirectParam, origin))
  } catch (error) {
    console.error('Unexpected OAuth error:', error)
    // Handle unexpected errors
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'Authentication failed. Please try again.')
    loginUrl.searchParams.delete('code')
    return NextResponse.redirect(loginUrl)
  }
}
