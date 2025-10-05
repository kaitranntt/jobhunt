import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

  if (!authCode || errorParam || errorDescription) {
    const loginUrl = new URL('/login', origin)
    const errorMessage = errorDescription || errorParam || 'Unable to authenticate with Google'
    loginUrl.searchParams.set('error', errorMessage)
    return NextResponse.redirect(loginUrl)
  }

  const { error } = await supabase.auth.exchangeCodeForSession(authCode)

  if (error) {
    const loginUrl = new URL('/login', origin)
    loginUrl.searchParams.set('error', error.message)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(new URL(redirectParam, origin))
}
