'use client'

import * as React from 'react'
import { ArrowLeft, User, Mail, Calendar, Shield } from 'lucide-react'
import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = React.useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Load user session on mount
  React.useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient()
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          throw authError
        }

        if (!currentUser) {
          // Redirect to login if no user
          router.push('/')
          return
        }

        setUser(currentUser)
      } catch (err) {
        console.error('Error loading user:', err)
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [router])

  if (isLoading) {
    return (
      <AnimatedBackground variant="minimal">
        <div className="min-h-screen">
          <NavBar variant="authenticated" user={user} />
          <main className="mx-auto w-full px-4 py-4">
            <div className="flex items-center justify-center p-8 glass-ultra rounded-glass shadow-glass-subtle">
              <p className="text-label-secondary">Loading profile...</p>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    )
  }

  if (error || !user) {
    return (
      <AnimatedBackground variant="minimal">
        <div className="min-h-screen">
          <NavBar variant="authenticated" user={user} />
          <main className="mx-auto w-full px-4 py-4">
            <div className="flex items-center justify-center p-8 glass-light rounded-glass shadow-glass-soft">
              <div className="text-center">
                <h2 className="text-lg font-medium text-red-600 mb-2">Error</h2>
                <p className="text-label-secondary mb-4">{error || 'User not found'}</p>
                <Button onClick={() => router.push('/dashboard')} variant="outline">
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground variant="minimal">
      <div className="min-h-screen">
        <NavBar variant="authenticated" user={user} />

        <main className="mx-auto w-full px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                size="sm"
                className="glass-interactive"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold text-label-primary">My Profile</h1>
            </div>

            {/* Profile Card */}
            <Card className="glass-heavy border border-[var(--glass-border-subtle)] mb-6">
              <div className="p-6">
                <div className="flex items-center gap-6 mb-6">
                  {/* Avatar */}
                  <div className="w-20 h-20 rounded-full bg-[var(--tint-blue)] text-white flex items-center justify-center text-2xl font-medium">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  {/* Basic Info */}
                  <div>
                    <h2 className="text-xl font-semibold text-label-primary mb-1">
                      {user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'}
                    </h2>
                    <p className="text-label-secondary">{user.email}</p>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-4 glass-light rounded-glass">
                    <Mail className="h-5 w-5 text-[var(--tint-blue)]" />
                    <div>
                      <p className="text-sm text-label-secondary">Email</p>
                      <p className="font-medium text-label-primary">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 glass-light rounded-glass">
                    <Calendar className="h-5 w-5 text-[var(--tint-blue)]" />
                    <div>
                      <p className="text-sm text-label-secondary">Member Since</p>
                      <p className="font-medium text-label-primary">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 glass-light rounded-glass">
                    <Shield className="h-5 w-5 text-[var(--tint-blue)]" />
                    <div>
                      <p className="text-sm text-label-secondary">Authentication</p>
                      <p className="font-medium text-label-primary">
                        {user.email_confirmed_at ? 'Verified' : 'Unverified'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 glass-light rounded-glass">
                    <User className="h-5 w-5 text-[var(--tint-blue)]" />
                    <div>
                      <p className="text-sm text-label-secondary">User ID</p>
                      <p className="font-medium text-label-primary text-xs">
                        {user.id.slice(0, 8)}...{user.id.slice(-4)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Metadata */}
                {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-label-primary mb-3">
                      Additional Information
                    </h3>
                    <div className="glass-light rounded-glass p-4">
                      <pre className="text-sm text-label-secondary overflow-x-auto">
                        {JSON.stringify(user.user_metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Note */}
            <Card className="glass-medium border border-[var(--glass-border-subtle)]">
              <div className="p-4 text-center">
                <p className="text-sm text-label-secondary">
                  Profile editing and settings management will be available in future updates.
                </p>
              </div>
            </Card>
          </div>
        </main>
      </div>
    </AnimatedBackground>
  )
}
