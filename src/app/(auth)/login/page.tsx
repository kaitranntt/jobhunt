'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { createClient } from '@/lib/supabase/client'
import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  useEffect(() => {
    if (!searchParams) return

    const errorParam = searchParams.get('error')
    const descriptionParam = searchParams.get('error_description')

    if (descriptionParam) {
      setError(descriptionParam)
    } else if (errorParam) {
      setError(errorParam)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const supabase = createClient()
      // Use environment variable or fall back to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
      const redirectUrl = `${siteUrl}/auth/callback?redirect_to=${encodeURIComponent('/dashboard')}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) throw error
    } catch (err) {
      setGoogleLoading(false)
      setError(err instanceof Error ? err.message : 'Google sign-in failed')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">Sign in to JobHunt</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Track your job applications efficiently
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full rounded-md btn-brand-gradient px-4 py-2 text-white hover:btn-brand-gradient-hover disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="h-px w-full bg-border" aria-hidden="true" />
              <span>or</span>
              <span className="h-px w-full bg-border" aria-hidden="true" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              className="w-full rounded-md border border-input bg-background px-4 py-2 text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FcGoogle className="h-5 w-5" />
              {googleLoading ? 'Redirecting...' : 'Continue with Google'}
            </button>

          <p className="text-center text-sm text-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-brand-primary hover:text-brand-primary/80">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AnimatedBackground>
      <NavBar variant="auth-pages" />
      <Suspense fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md space-y-8 p-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </AnimatedBackground>
  )
}
