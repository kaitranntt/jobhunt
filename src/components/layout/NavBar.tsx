'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Github, Search, Bell, ListTodo, BarChart3, Settings } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { ProfileDropdown } from '@/components/profile/ProfileDropdown'
import { cn } from '@/lib/utils'
import { useThemeColors } from '@/lib/theme/hooks'
import type { User } from '@supabase/supabase-js'

interface NavBarProps {
  variant?: 'landing' | 'authenticated' | 'auth-pages' | 'dashboard'
  user?: User | null
  userId?: string
  showThemeToggle?: boolean
  className?: string
  activeTab?: string
}

export function NavBar({
  variant = 'landing',
  user,
  userId,
  showThemeToggle = true,
  className,
  activeTab = 'tracker',
}: NavBarProps) {
  // Use theme colors for consistency
  const colors = useThemeColors([
    'primary',
    'textPrimary',
    'textSecondary',
    'background',
    'card',
    'borderCustom',
  ])
  // Variant 1: Landing Page NavBar
  if (variant === 'landing') {
    return (
      <header
        className={cn('fixed top-0 left-0 right-0 z-50 border-b glass-light', className)}
        style={{
          borderColor: 'var(--glass-border-subtle)',
          backdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="mx-auto w-[85%] px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-[28px] font-bold transition-opacity hover:opacity-80"
              style={{ fontFamily: 'var(--font-libre-baskerville)' }}
            >
              <Image
                src="/logo.png"
                alt="JobHunt Logo"
                width={32}
                height={32}
                className="h-8 w-8"
                style={{ color: colors.primary }}
              />
              JobHunt
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
      <header
        className={cn('border-b glass-medium shadow-glass-soft', className)}
        style={{
          borderColor: 'var(--glass-border-medium)',
          backdropFilter: 'blur(30px) saturate(200%)',
        }}
      >
        <div className="mx-auto w-[85%] px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-[28px] font-bold transition-opacity hover:opacity-80"
              style={{ fontFamily: 'var(--font-libre-baskerville)' }}
            >
              <Image
                src="/logo.png"
                alt="JobHunt Logo"
                width={32}
                height={32}
                className="h-8 w-8"
                style={{ color: colors.primary }}
              />
              JobHunt
            </Link>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              {user && userId && <ProfileDropdown userId={userId} user={{ email: user.email }} />}

              {showThemeToggle && <ThemeToggle />}
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Variant 3: Enhanced Dashboard NavBar
  if (variant === 'dashboard') {
    const getUserInitials = (user: User | null | undefined) => {
      if (!user?.email) return 'JD'
      const email = user.email
      const nameParts = email.split('@')[0].split('.')
      return nameParts.length > 1
        ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
        : email.slice(0, 2).toUpperCase()
    }

    return (
      <header
        className={cn('w-full px-6 py-3 mb-4', className)}
        style={{
          backgroundColor: 'var(--glass-light)',
          borderRadius: '12px',
          boxShadow: '0 2px 10px var(--shadow-soft)',
          backdropFilter: 'blur(20px) saturate(180%)',
        }}
      >
        <div className="flex items-center justify-between">
          {/* Logo with Icon */}
          <div className="flex items-center gap-3">
            <ListTodo className="h-6 w-6" style={{ color: 'var(--tint-blue)' }} />
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-2xl font-bold transition-opacity hover:opacity-80"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--tint-blue)',
              }}
            >
              JobHunt
            </Link>
          </div>

          {/* Main Navigation Tabs */}
          <div className="flex gap-1">
            <Link
              href="/dashboard?tab=tracker"
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                activeTab === 'tracker' ? '' : ''
              )}
              style={{
                backgroundColor: activeTab === 'tracker' ? 'var(--tint-blue)' : 'transparent',
                color: activeTab === 'tracker' ? 'white' : 'var(--macos-label-secondary)',
              }}
            >
              <ListTodo className="h-4 w-4" />
              Tracker
            </Link>
            <Link
              href="/dashboard?tab=overview"
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                activeTab === 'overview' ? '' : ''
              )}
              style={{
                backgroundColor: activeTab === 'overview' ? 'var(--tint-blue)' : 'transparent',
                color: activeTab === 'overview' ? 'white' : 'var(--macos-label-secondary)',
              }}
            >
              <BarChart3 className="h-4 w-4" />
              Overview
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div
              className="flex items-center rounded-lg px-3 py-2 w-64"
              style={{
                backgroundColor: 'var(--macos-fill-secondary)',
              }}
            >
              <Search className="h-4 w-4 mr-2" style={{ color: 'var(--macos-label-tertiary)' }} />
              <span className="text-sm" style={{ color: 'var(--macos-label-tertiary)' }}>
                Search applications
              </span>
            </div>

            {/* Settings */}
            <button
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--macos-label-secondary)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 'var(--macos-fill-secondary)'
                e.currentTarget.style.color = 'var(--macos-label-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.color = 'var(--macos-label-secondary)'
              }}
            >
              <Settings className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <Bell
              className="h-5 w-5 cursor-pointer transition-colors"
              style={{ color: 'var(--macos-label-secondary)' }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--macos-label-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--macos-label-secondary)'
              }}
            />

            {/* User Profile */}
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium cursor-pointer transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--tint-blue)' }}
            >
              {getUserInitials(user)}
            </div>

            {showThemeToggle && <ThemeToggle />}
          </div>
        </div>
      </header>
    )
  }

  // Variant 4: Auth Pages NavBar (Login/Signup)
  if (variant === 'auth-pages') {
    return (
      <header
        className={cn('border-b glass-ultra', className)}
        style={{
          borderColor: 'var(--glass-border-subtle)',
          backdropFilter: 'blur(15px) saturate(150%)',
        }}
      >
        <div className="mx-auto w-[85%] px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-[28px] font-bold transition-opacity hover:opacity-80"
              style={{ fontFamily: 'var(--font-libre-baskerville)' }}
            >
              <Image
                src="/logo.png"
                alt="JobHunt Logo"
                width={32}
                height={32}
                className="h-8 w-8"
                style={{ color: colors.primary }}
              />
              JobHunt
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
