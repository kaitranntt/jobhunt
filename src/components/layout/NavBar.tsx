'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ProfileDropdown } from '@/components/profile/ProfileDropdown'
import { cn } from '@/lib/utils'
import type { User } from '@supabase/supabase-js'

interface NavBarProps {
  variant?: 'landing' | 'authenticated' | 'auth-pages'
  user?: User | null
  userId?: string
  showThemeToggle?: boolean
  className?: string
}

export function NavBar({
  variant = 'landing',
  user,
  userId,
  showThemeToggle = true,
  className,
}: NavBarProps) {
  // Unified styling for all variants
  const unifiedStyles = {
    borderColor: 'var(--glass-border-subtle)',
    backdropFilter: 'blur(20px) saturate(180%)',
  }

  // Determine logo destination based on variant
  const logoHref = variant === 'authenticated' ? '/dashboard' : '/'

  // Variant 1: Landing Page NavBar
  if (variant === 'landing') {
    return (
      <header
        className={cn('fixed top-0 left-0 right-0 z-50 border-b glass-light', className)}
        style={unifiedStyles}
      >
        <div className="mx-auto w-[85%] px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-xl font-semibold text-label-primary transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo.png"
                alt="JobHunt Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="gradient-brand-text">JobHunt</span>
            </Link>

            {/* Navigation Links & Actions */}
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="hidden sm:inline-flex items-center gap-2 rounded-glass-sm glass-medium px-4 py-2 text-sm font-semibold text-label-primary shadow-glass-subtle hover:glass-heavy transition-all duration-300"
                    style={{
                      border: '1px solid var(--glass-border-strong)',
                    }}
                  >
                    Go to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-label-primary hover:text-label-secondary transition-colors glass-interactive"
                  >
                    Log In
                  </Link>

                  <Link
                    href="/signup"
                    className="hidden sm:inline-flex items-center gap-2 rounded-glass-sm glass-medium px-4 py-2 text-sm font-semibold text-label-primary shadow-glass-subtle hover:glass-heavy transition-all duration-300"
                    style={{
                      border: '1px solid var(--glass-border-strong)',
                    }}
                  >
                    Get Started
                  </Link>
                </>
              )}

              <Link
                href="https://github.com/kaitranntt/jobhunt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-label-primary hover:text-label-secondary transition-colors glass-interactive"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Link>

              {showThemeToggle && <ThemeToggle />}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Variant 2: Authenticated Pages NavBar (Dashboard)
  if (variant === 'authenticated') {
    return (
      <header className={cn('border-b glass-light', className)} style={unifiedStyles}>
        <div className="mx-auto w-[85%] px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-xl font-semibold text-label-primary transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo.png"
                alt="JobHunt Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="gradient-brand-text">JobHunt</span>
            </Link>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              {user && userId && (
                <>
                  {/* User Email - shown on desktop only */}
                  <div className="hidden sm:block">
                    <span className="text-sm text-label-secondary">{user.email}</span>
                  </div>
                  <ProfileDropdown userId={userId} user={{ email: user.email }} />
                </>
              )}

              {showThemeToggle && <ThemeToggle />}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Variant 3: Auth Pages NavBar (Login/Signup)
  if (variant === 'auth-pages') {
    return (
      <header className={cn('border-b glass-light', className)} style={unifiedStyles}>
        <div className="mx-auto w-[85%] px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href={logoHref}
              className="flex items-center gap-2 text-xl font-semibold text-label-primary transition-opacity hover:opacity-80"
            >
              <Image
                src="/logo.png"
                alt="JobHunt Logo"
                width={24}
                height={24}
                className="h-6 w-6"
              />
              <span className="gradient-brand-text">JobHunt</span>
            </Link>

            {/* Theme Toggle */}
            {showThemeToggle && (
              <div className="flex items-center">
                <ThemeToggle />
              </div>
            )}
          </div>
        </div>
      </header>
    )
  }

  // Default fallback (should never reach here with TypeScript)
  return null
}
