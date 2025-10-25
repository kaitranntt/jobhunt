'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { createUserProfileAction } from './actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import type { UserProfileInsert } from '@/lib/types/database.types'

interface SimplifiedFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

interface SimplifiedSignupFormProps {
  onSuccess?: () => void
}

export function SimplifiedSignupForm({ onSuccess }: SimplifiedSignupFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState<SimplifiedFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const updateFormData = (field: keyof SimplifiedFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) {
      setError('')
    }
  }

  const validateForm = (): boolean => {
    setError('')

    if (
      !formData.firstName.trim() ||
      !formData.lastName.trim() ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError('All fields are required')
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('User creation failed')

      const profileData: UserProfileInsert = {
        user_id: authData.user.id,
        full_name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        phone: null,
        location: null,
        job_role: null,
        desired_roles: null,
        desired_industries: null,
        experience_years: null,
        linkedin_url: null,
        portfolio_url: null,
      }

      const result = await createUserProfileAction(profileData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create profile')
      }

      if (onSuccess) {
        onSuccess()
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground">Create your account</h2>
        <p className="mt-2 text-lg text-muted-foreground">
          Join thousands of professionals who trust JobHunt for career tracking
        </p>
      </div>

      {/* Form with contrast background */}
      <div className="bg-background/80 backdrop-blur-sm rounded-xl p-8 shadow-lg border border-border/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
              {error}
            </div>
          )}

          {/* Name Fields Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  First name *
                </label>
                <Input
                  id="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={e => updateFormData('firstName', e.target.value)}
                  variant="glass"
                  placeholder="John"
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Last name *
                </label>
                <Input
                  id="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={e => updateFormData('lastName', e.target.value)}
                  variant="glass"
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Account Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Account Information</h3>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address *
              </label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={e => updateFormData('email', e.target.value)}
                variant="glass"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password (min. 6 characters) *
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={e => updateFormData('password', e.target.value)}
                  variant="glass"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Confirm password *
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={e => updateFormData('confirmPassword', e.target.value)}
                  variant="glass"
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Create Account Button */}
          <Button type="submit" disabled={loading} className="w-full btn-brand-gradient py-3">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          {/* Sign In Link */}
          <div className="text-center pt-4 border-t border-border/50">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              href="/login"
              className="font-medium text-brand-primary hover:text-brand-primary/80"
            >
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
