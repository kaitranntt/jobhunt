import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateOAuthProfile } from '@/lib/auth/oauth-actions'
import {
  OAuthDebugger,
  validateOAuthConfiguration,
  analyzeOAuthError,
} from '@/lib/auth/oauth-debug'

function getRedirectPath(redirectParam: string | null) {
  if (!redirectParam) return '/dashboard'

  if (redirectParam.startsWith('/') && !redirectParam.startsWith('//')) {
    return redirectParam
  }

  return '/dashboard'
}

export async function GET(request: NextRequest) {
  // Clear any previous debug logs and start fresh
  OAuthDebugger.clearLogs()

  // Validate OAuth configuration at the start
  const configValidation = validateOAuthConfiguration()
  if (!configValidation.isValid) {
    console.error('OAuth Configuration Error:', configValidation.issues)
    const loginUrl = new URL('/login', request.nextUrl.origin)
    loginUrl.searchParams.set('error', 'OAuth configuration error')
    loginUrl.searchParams.set('details', configValidation.issues.join(', '))
    return NextResponse.redirect(loginUrl)
  }

  const supabase = await createClient()
  const { searchParams, origin } = request.nextUrl

  const authCode = searchParams.get('code')
  const errorParam = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const redirectParam = getRedirectPath(searchParams.get('redirect_to'))
  const userAgent = request.headers.get('user-agent')

  // Comprehensive logging
  OAuthDebugger.log(
    'Callback Initiated',
    {
      hasAuthCode: !!authCode,
      errorParam,
      errorDescription,
      redirectParam,
      userAgent,
      fullUrl: request.url,
      searchParams: Object.fromEntries(searchParams),
      timestamp: new Date().toISOString(),
    },
    userAgent || undefined
  )

  // Handle missing code or errors
  if (!authCode || errorParam || errorDescription) {
    const errorMessage = errorDescription || errorParam || 'Unable to authenticate with Google'

    // Analyze the error for better debugging
    const errorAnalysis = analyzeOAuthError(errorParam || errorDescription)

    OAuthDebugger.log('OAuth Error Received', {
      errorMessage,
      errorParam,
      errorDescription,
      errorAnalysis,
      hasAuthCode: !!authCode,
    })

    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', errorMessage)

    // Add detailed error information for debugging
    if (errorAnalysis.type) {
      loginUrl.searchParams.set('error_type', errorAnalysis.type)
      loginUrl.searchParams.set('error_severity', errorAnalysis.severity)
      loginUrl.searchParams.set('error_suggestion', errorAnalysis.suggestion)
    }

    // Clean URL parameters
    loginUrl.searchParams.delete('code')
    loginUrl.searchParams.delete('access_token')
    loginUrl.searchParams.delete('refresh_token')

    return NextResponse.redirect(loginUrl)
  }

  try {
    OAuthDebugger.log('Code Exchange Started', {
      authCodeLength: authCode?.length,
      authCodePrefix: authCode?.substring(0, 8) + '...',
    })

    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(authCode)

    if (error) {
      const errorAnalysis = analyzeOAuthError(error)

      OAuthDebugger.log('Code Exchange Failed', {
        error,
        errorAnalysis,
        authCodeUsed: !!authCode,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      })

      const loginUrl = new URL('/login', origin)
      loginUrl.searchParams.set('error', error.message)

      if (errorAnalysis.type) {
        loginUrl.searchParams.set('error_type', errorAnalysis.type)
        loginUrl.searchParams.set('error_severity', errorAnalysis.severity)
        loginUrl.searchParams.set('error_suggestion', errorAnalysis.suggestion)
      }

      loginUrl.searchParams.delete('code')
      return NextResponse.redirect(loginUrl)
    }

    OAuthDebugger.log('Code Exchange Successful', {
      userId: user?.id,
      email: user?.email,
      emailVerified: user?.email_confirmed_at,
      createdAt: user?.created_at,
      lastSignIn: user?.last_sign_in_at,
      provider: user?.app_metadata?.provider,
    })

    // For OAuth users, automatically create profile if it doesn't exist
    if (user) {
      OAuthDebugger.log('Profile Processing Started', {
        userId: user.id,
        userEmail: user.email,
      })

      const profileResult = await getOrCreateOAuthProfile(user)

      OAuthDebugger.log('Profile Processing Result', {
        profileResult,
        userId: user.id,
        success: profileResult.success,
        hasData: !!profileResult.data,
        isNew: profileResult.isNew,
        error: profileResult.error,
      })

      if (!profileResult.success && !profileResult.data) {
        OAuthDebugger.log('Profile Creation Failed', {
          profileResult,
          userId: user.id,
        })

        const loginUrl = new URL('/login', origin)
        loginUrl.searchParams.set('error', 'Profile setup failed. Please try again.')
        loginUrl.searchParams.set('error_type', 'profile_creation_failed')
        loginUrl.searchParams.delete('code')
        return NextResponse.redirect(loginUrl)
      }

      // If this is a new OAuth profile, add a flag for welcome experience
      if (profileResult.isNew) {
        OAuthDebugger.log('New OAuth Profile Created', {
          userId: user.id,
          profileData: profileResult.data,
        })

        const dashboardUrl = new URL(redirectParam, origin)
        dashboardUrl.searchParams.set('welcome', 'oauth')
        return NextResponse.redirect(dashboardUrl)
      }

      OAuthDebugger.log('Existing OAuth Profile Found', {
        userId: user.id,
        profileData: profileResult.data,
      })
    }

    // Successful authentication - redirect to intended destination
    OAuthDebugger.log('Authentication Successful', {
      redirectParam,
      origin,
      finalUrl: `${origin}${redirectParam}`,
      allDebugLogs: OAuthDebugger.getLogs(),
    })

    return NextResponse.redirect(new URL(redirectParam, origin))
  } catch (error) {
    const errorAnalysis = analyzeOAuthError(error)

    OAuthDebugger.log('Unexpected OAuth Error', {
      error,
      errorAnalysis,
      stack: error instanceof Error ? error.stack : undefined,
    })

    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', 'Authentication failed. Please try again.')

    if (errorAnalysis.type) {
      loginUrl.searchParams.set('error_type', errorAnalysis.type)
      loginUrl.searchParams.set('error_severity', errorAnalysis.severity)
      loginUrl.searchParams.set('error_suggestion', errorAnalysis.suggestion)
    }

    loginUrl.searchParams.delete('code')
    return NextResponse.redirect(loginUrl)
  }
}
