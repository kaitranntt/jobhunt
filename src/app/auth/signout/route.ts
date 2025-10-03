import { createClient } from '@/lib/supabase/server'
import { type NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    await supabase.auth.signOut()
  }

  // Use request.url as base for reliable URL construction
  const url = new URL('/login', new URL(request.url).origin)
  return NextResponse.redirect(url)
}
