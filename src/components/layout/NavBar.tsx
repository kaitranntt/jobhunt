import Link from 'next/link'
import { Briefcase, Github } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { cn } from '@/lib/utils'

interface NavBarProps {
  variant?: 'landing' | 'authenticated' | 'auth-pages'
  user?: { email: string } | null
  showThemeToggle?: boolean
  className?: string
}

export function NavBar({
  variant = 'landing',
  user,
  showThemeToggle = true,
  className,
}: NavBarProps) {
  // Variant 1: Landing Page NavBar
  if (variant === 'landing') {
    return (
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 border-b border-border bg-background shadow-sm',
          className
        )}
      >
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold gradient-brand-text transition-opacity hover:opacity-80"
            >
              <Briefcase className="h-6 w-6 text-brand-primary" />
              JobHunt
            </Link>

            {/* Navigation Links & Actions */}
            <div className="flex items-center gap-4">
              <Link
                href="/signup"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-brand-primary transition-colors"
              >
                Get Started
              </Link>

              <Link
                href="https://github.com/kaitranntt/jobhunt"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View on GitHub"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-brand-primary transition-colors"
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
        className={cn('border-b border-border bg-card shadow-sm', className)}
      >
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xl font-bold text-foreground transition-opacity hover:opacity-80"
            >
              <Briefcase className="h-6 w-6 text-brand-primary" />
              JobHunt
            </Link>

            {/* User Info & Actions */}
            <div className="flex items-center gap-4">
              {user && (
                <span className="hidden sm:inline-block text-sm text-muted-foreground">
                  {user.email}
                </span>
              )}

              {showThemeToggle && <ThemeToggle />}

              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  aria-label="Sign out of your account"
                  className="rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground shadow-sm ring-1 ring-inset ring-border hover:bg-secondary/80 transition-colors"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>
    )
  }

  // Variant 3: Auth Pages NavBar (Login/Signup)
  if (variant === 'auth-pages') {
    return (
      <header
        className={cn('border-b border-border/50 bg-background', className)}
      >
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold gradient-brand-text transition-opacity hover:opacity-80"
            >
              <Briefcase className="h-6 w-6 text-brand-primary" />
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
