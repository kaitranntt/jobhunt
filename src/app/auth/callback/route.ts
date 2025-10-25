import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next') ?? '/dashboard'

  // Handle authentication errors
  if (error || errorDescription) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', errorDescription || error || 'Authentication failed')
    loginUrl.searchParams.delete('code')
    loginUrl.searchParams.delete('access_token')
    loginUrl.searchParams.delete('refresh_token')
    return NextResponse.redirect(loginUrl)
  }

  // If there's an auth code, Supabase will automatically handle the exchange
  if (code) {
    // Creating the Supabase client with the auth code in URL
    // automatically exchanges the code for a session and sets cookies
    await createClient()

    // Redirect to intended destination
    return NextResponse.redirect(new URL(next, request.url))
  }

  // No code and no error - redirect to login
  const loginUrl = new URL('/login', request.url)
  return NextResponse.redirect(loginUrl)
}
