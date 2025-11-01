import { createClient } from '@/lib/supabase/server'
import { LandingContent } from '@/components/layout/LandingContent'

// Force dynamic rendering to avoid build-time Supabase client initialization
export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return <LandingContent user={user} />
}
