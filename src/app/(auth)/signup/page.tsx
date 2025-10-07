'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { createClient } from '@/lib/supabase/client'
import { createUserProfileAction } from './actions'
import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { UserProfileInsert } from '@/lib/types/database.types'

type FormStep = 1 | 2 | 3 | 4

interface FormData {
  email: string
  password: string
  first_name: string
  last_name: string
  phone: string
  location: string
  job_role: string
  experience_years: string
  linkedin_url: string
  portfolio_url: string
  desired_roles: string
  desired_industries: string
}

export default function SignupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<FormStep>(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    location: '',
    job_role: '',
    experience_years: '',
    linkedin_url: '',
    portfolio_url: '',
    desired_roles: '',
    desired_industries: '',
  })

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateStep = (): boolean => {
    setError('')

    switch (currentStep) {
      case 1:
        if (!formData.email || !formData.password) {
          setError('Email and password are required')
          return false
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters')
          return false
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          setError('Please enter a valid email address')
          return false
        }
        return true

      case 2:
        if (!formData.first_name.trim()) {
          setError('First name is required')
          return false
        }
        if (!formData.last_name.trim()) {
          setError('Last name is required')
          return false
        }
        return true

      case 3:
        if (formData.linkedin_url && !/^https?:\/\/.+/.test(formData.linkedin_url)) {
          setError('LinkedIn URL must be a valid URL')
          return false
        }
        if (formData.portfolio_url && !/^https?:\/\/.+/.test(formData.portfolio_url)) {
          setError('Portfolio URL must be a valid URL')
          return false
        }
        if (formData.experience_years) {
          const years = parseInt(formData.experience_years, 10)
          if (isNaN(years) || years < 0 || years > 100) {
            setError('Experience years must be between 0 and 100')
            return false
          }
        }
        return true

      case 4:
        return true

      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < 4) {
        setCurrentStep((currentStep + 1) as FormStep)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as FormStep)
      setError('')
    }
  }

  const handleSkip = () => {
    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as FormStep)
      setError('')
    } else {
      handleFinalSubmit()
    }
  }

  const handleFinalSubmit = async () => {
    if (!validateStep()) return

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

      const fullName = `${formData.first_name.trim()} ${formData.last_name.trim()}`

      const profileData: UserProfileInsert = {
        user_id: authData.user.id,
        full_name: fullName,
        phone: formData.phone.trim() || null,
        location: formData.location.trim() || null,
        job_role: formData.job_role.trim() || null,
        desired_roles: formData.desired_roles.trim()
          ? formData.desired_roles.split(',').map(r => r.trim())
          : null,
        desired_industries: formData.desired_industries.trim()
          ? formData.desired_industries.split(',').map(i => i.trim())
          : null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years, 10) : null,
        linkedin_url: formData.linkedin_url.trim() || null,
        portfolio_url: formData.portfolio_url.trim() || null,
      }

      const result = await createUserProfileAction(profileData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to create profile')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const supabase = createClient()
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
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
      setError(err instanceof Error ? err.message : 'Google sign-up failed')
    }
  }

  const progressPercentage = (currentStep / 4) * 100

  return (
    <AnimatedBackground>
      <NavBar variant="auth-pages" />
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Create your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">Start tracking your job applications today</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Step {currentStep} of 4</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>
            <Progress value={progressPercentage} variant="glass" />
          </div>

          <div className="space-y-6">
            {error && <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">Account Credentials</h3>
                  <p className="text-sm text-muted-foreground">Create your login credentials</p>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
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
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                    Password (min. 6 characters) *
                  </label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={e => updateFormData('password', e.target.value)}
                    variant="glass"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="h-px w-full bg-border" aria-hidden="true" />
                  <span>or</span>
                  <span className="h-px w-full bg-border" aria-hidden="true" />
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading || loading}
                  variant="glass"
                  className="w-full"
                >
                  <FcGoogle className="h-5 w-5" />
                  {googleLoading ? 'Redirecting...' : 'Continue with Google'}
                </Button>

                <Button type="button" onClick={handleNext} disabled={loading} className="w-full btn-brand-gradient">
                  Next
                </Button>

                <p className="text-center text-sm text-foreground">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-brand-primary hover:text-brand-primary/80">
                    Sign in
                  </Link>
                </p>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                  <p className="text-sm text-muted-foreground">Tell us a bit about yourself</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-1">
                      First Name *
                    </label>
                    <Input
                      id="first_name"
                      type="text"
                      required
                      value={formData.first_name}
                      onChange={e => updateFormData('first_name', e.target.value)}
                      variant="glass"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-1">
                      Last Name *
                    </label>
                    <Input
                      id="last_name"
                      type="text"
                      required
                      value={formData.last_name}
                      onChange={e => updateFormData('last_name', e.target.value)}
                      variant="glass"
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={e => updateFormData('phone', e.target.value)}
                    variant="glass"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">
                    Location
                  </label>
                  <Input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={e => updateFormData('location', e.target.value)}
                    variant="glass"
                    placeholder="San Francisco, CA"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleBack} variant="glass" className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleSkip} variant="outline" className="flex-1">
                    Skip
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1 btn-brand-gradient">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">Professional Info</h3>
                  <p className="text-sm text-muted-foreground">Share your professional background</p>
                </div>

                <div>
                  <label htmlFor="job_role" className="block text-sm font-medium text-foreground mb-1">
                    Current Role
                  </label>
                  <Input
                    id="job_role"
                    type="text"
                    value={formData.job_role}
                    onChange={e => updateFormData('job_role', e.target.value)}
                    variant="glass"
                    placeholder="Software Engineer"
                  />
                </div>

                <div>
                  <label htmlFor="experience_years" className="block text-sm font-medium text-foreground mb-1">
                    Years of Experience
                  </label>
                  <Input
                    id="experience_years"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.experience_years}
                    onChange={e => updateFormData('experience_years', e.target.value)}
                    variant="glass"
                    placeholder="5"
                  />
                </div>

                <div>
                  <label htmlFor="linkedin_url" className="block text-sm font-medium text-foreground mb-1">
                    LinkedIn URL
                  </label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    value={formData.linkedin_url}
                    onChange={e => updateFormData('linkedin_url', e.target.value)}
                    variant="glass"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div>
                  <label htmlFor="portfolio_url" className="block text-sm font-medium text-foreground mb-1">
                    Portfolio URL
                  </label>
                  <Input
                    id="portfolio_url"
                    type="url"
                    value={formData.portfolio_url}
                    onChange={e => updateFormData('portfolio_url', e.target.value)}
                    variant="glass"
                    placeholder="https://yourportfolio.com"
                  />
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleBack} variant="glass" className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleSkip} variant="outline" className="flex-1">
                    Skip
                  </Button>
                  <Button type="button" onClick={handleNext} className="flex-1 btn-brand-gradient">
                    Next
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground">Job Preferences</h3>
                  <p className="text-sm text-muted-foreground">What are you looking for?</p>
                </div>

                <div>
                  <label htmlFor="desired_roles" className="block text-sm font-medium text-foreground mb-1">
                    Desired Roles
                  </label>
                  <Input
                    id="desired_roles"
                    type="text"
                    value={formData.desired_roles}
                    onChange={e => updateFormData('desired_roles', e.target.value)}
                    variant="glass"
                    placeholder="Frontend Engineer, Full Stack Developer (comma-separated)"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Separate multiple roles with commas</p>
                </div>

                <div>
                  <label htmlFor="desired_industries" className="block text-sm font-medium text-foreground mb-1">
                    Desired Industries
                  </label>
                  <Input
                    id="desired_industries"
                    type="text"
                    value={formData.desired_industries}
                    onChange={e => updateFormData('desired_industries', e.target.value)}
                    variant="glass"
                    placeholder="Technology, FinTech, Healthcare (comma-separated)"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Separate multiple industries with commas</p>
                </div>

                <div className="flex gap-2">
                  <Button type="button" onClick={handleBack} variant="glass" className="flex-1">
                    Back
                  </Button>
                  <Button type="button" onClick={handleSkip} variant="outline" className="flex-1">
                    Skip
                  </Button>
                  <Button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="flex-1 btn-brand-gradient"
                  >
                    {loading ? 'Creating account...' : 'Complete Signup'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AnimatedBackground>
  )
}
