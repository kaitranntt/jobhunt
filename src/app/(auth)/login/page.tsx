'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { devLoginAsTestUser, TEST_USER } from '@/lib/auth/dev-login'

function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const searchParams = useSearchParams()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleDevLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const success = await devLoginAsTestUser()
      if (success) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setError('Dev login failed. Check console for details.')
      }
    } catch (err) {
      setError('Dev login error: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center pt-20">
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
            disabled={loading}
            className="w-full rounded-md btn-brand-gradient px-4 py-2 text-white hover:btn-brand-gradient-hover disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {process.env.NODE_ENV === 'development' && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Development</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDevLogin}
                disabled={loading}
                className="w-full rounded-md border border-dashed border-brand-primary/50 bg-brand-primary/5 px-4 py-2 text-sm font-medium text-brand-primary hover:bg-brand-primary/10 disabled:opacity-50"
              >
                🚀 Quick Login as Test User
              </button>

              <p className="text-center text-xs text-muted-foreground">
                {TEST_USER.email} / {TEST_USER.password}
              </p>
            </div>
          )}

          <p className="text-center text-sm text-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-medium text-brand-primary hover:text-brand-primary/80"
            >
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
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center pt-20">
            <div className="w-full max-w-md space-y-8 p-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </AnimatedBackground>
  )
}
