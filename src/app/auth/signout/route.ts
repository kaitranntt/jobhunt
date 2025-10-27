import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

async function handleSignOut(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // Use NEXT_PUBLIC_SITE_URL for consistent redirect, fallback to request origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin
  const url = new URL('/login', siteUrl)

  return NextResponse.redirect(url, { status: 303 })
}

// Support both POST (form submission) and GET (direct navigation)
export async function POST(request: NextRequest) {
  return handleSignOut(request)
}

export async function GET(request: NextRequest) {
  return handleSignOut(request)
}
