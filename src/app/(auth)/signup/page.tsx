'use client'

import { NavBar } from '@/components/layout/NavBar'
import { AnimatedBackground } from '@/components/layout/AnimatedBackground'
import { SimplifiedSignupForm } from './SimplifiedSignupForm'

export default function SignupPage() {
  return (
    <AnimatedBackground>
      <NavBar variant="auth-pages" />
      <div className="flex min-h-screen items-center justify-center px-4 py-12 pt-20">
        <SimplifiedSignupForm />
      </div>
    </AnimatedBackground>
  )
}
